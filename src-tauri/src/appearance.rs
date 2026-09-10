//! System appearance detection for Linux (dark mode + text scaling).
//!
//! Tauri's webview (WebKitGTK on Linux) does not pick up GNOME/KDE's dark
//! mode or text-scaling preferences on its own: those live behind the
//! xdg-desktop-portal `Settings` interface, and plain GTK3 only reports
//! "prefers dark" when the active GTK theme name ends in `-dark`, which is
//! not the case on stock Fedora/GNOME even with "prefer-dark" selected in
//! Settings. We read the portal ourselves at startup, push the result to
//! native GTK (so dialogs/menus match) and to the frontend (so the page's
//! own dark styles and font sizing follow suit), and keep listening for
//! changes so toggling the setting live updates the running app.

use serde::Serialize;

#[derive(Debug, Clone, Copy, Serialize)]
pub struct Appearance {
    pub prefers_dark: bool,
    /// GNOME/GTK text scaling factor (org.gnome.desktop.interface
    /// text-scaling-factor), e.g. 1.25 for "Large Text". Defaults to 1.0
    /// when unavailable (non-GNOME desktops, portal missing, etc).
    pub text_scale: f64,
}

impl Default for Appearance {
    fn default() -> Self {
        Self { prefers_dark: false, text_scale: 1.0 }
    }
}

/// Frontend-facing snapshot. On Linux this trusts our own portal read (the
/// window's reported theme isn't reliable there — same underlying gap this
/// module exists to work around). On other platforms the webview/window
/// theme detection tauri ships is already correct, so we prefer it over our
/// (there: neutral-default) `detect()`.
#[tauri::command]
pub fn get_system_appearance(window: tauri::WebviewWindow) -> Appearance {
    let mut appearance = detect();
    if cfg!(not(target_os = "linux")) {
        if let Ok(theme) = window.theme() {
            appearance.prefers_dark = theme == tauri::Theme::Dark;
        }
    }
    appearance
}

#[cfg(target_os = "linux")]
pub use linux::{detect, watch};

#[cfg(not(target_os = "linux"))]
pub fn detect() -> Appearance {
    Appearance::default()
}

#[cfg(not(target_os = "linux"))]
pub fn watch(_app: tauri::AppHandle) {}

#[cfg(target_os = "linux")]
mod linux {
    use super::Appearance;
    use tauri::{AppHandle, Emitter};
    use zbus::blocking::{Connection, MessageIterator};
    use zbus::zvariant::{OwnedValue, Value};
    use zbus::MatchRule;

    const PORTAL_DEST: &str = "org.freedesktop.portal.Desktop";
    const PORTAL_PATH: &str = "/org/freedesktop/portal/desktop";
    const PORTAL_IFACE: &str = "org.freedesktop.portal.Settings";

    /// Read one portal setting. Returns `None` on any error (no portal,
    /// unknown namespace/key on non-GNOME desktops, etc) rather than
    /// failing — callers just keep their default in that case.
    fn read_setting(conn: &Connection, namespace: &str, key: &str) -> Option<Value<'static>> {
        let reply = conn
            .call_method(Some(PORTAL_DEST), PORTAL_PATH, Some(PORTAL_IFACE), "Read", &(namespace, key))
            .ok()?;
        let owned: OwnedValue = reply.body().deserialize().ok()?;
        Some(Value::from(owned))
    }

    /// Query the portal once for the current color scheme and text scale.
    /// Falls back to light/1.0 on any error — never fails the caller.
    pub fn detect() -> Appearance {
        let mut appearance = Appearance::default();
        let Ok(conn) = Connection::session() else { return appearance };

        // `downcast` also unwraps the extra variant layer some portal
        // backends wrap single values in.
        if let Some(v) = read_setting(&conn, "org.freedesktop.appearance", "color-scheme") {
            if let Ok(scheme) = v.downcast::<u32>() {
                // 0 = no preference, 1 = prefer dark, 2 = prefer light.
                appearance.prefers_dark = scheme == 1;
            }
        }

        if let Some(v) = read_setting(&conn, "org.gnome.desktop.interface", "text-scaling-factor") {
            if let Ok(scale) = v.downcast::<f64>() {
                if scale > 0.0 {
                    appearance.text_scale = scale;
                }
            }
        }

        log::info!(
            "system appearance: prefers_dark={} text_scale={}",
            appearance.prefers_dark,
            appearance.text_scale
        );
        appearance
    }

    /// Apply the given appearance to native GTK chrome so dialogs, menus,
    /// etc. match the web content's theme.
    fn apply_to_gtk(appearance: Appearance) {
        use gtk::prelude::GtkSettingsExt;
        if let Some(settings) = gtk::Settings::default() {
            settings.set_gtk_application_prefer_dark_theme(appearance.prefers_dark);
        }
    }

    fn watch_loop(app: &AppHandle) -> zbus::Result<()> {
        let conn = Connection::session()?;
        let rule = MatchRule::builder()
            .msg_type(zbus::message::Type::Signal)
            .interface(PORTAL_IFACE)?
            .member("SettingChanged")?
            .build();
        let iter = MessageIterator::for_match_rule(rule, &conn, Some(4))?;

        for msg in iter {
            if msg.is_err() {
                continue;
            }
            // Namespace/key granularity isn't worth parsing precisely — just
            // re-read both settings we care about and push the result along.
            let appearance = detect();
            apply_to_gtk(appearance);
            let _ = app.emit("system-appearance-changed", appearance);
        }
        Ok(())
    }

    /// Detect the current appearance, apply it to native GTK, and spawn a
    /// background thread that listens for portal `SettingChanged` signals
    /// so live toggles (e.g. flipping GNOME's dark-mode switch) are
    /// reflected without restarting the app. Emits `system-appearance-changed`
    /// with the updated `Appearance` to the frontend on every change.
    pub fn watch(app: AppHandle) {
        apply_to_gtk(detect());

        std::thread::spawn(move || {
            if let Err(err) = watch_loop(&app) {
                log::warn!("system appearance watcher stopped: {err}");
            }
        });
    }
}
