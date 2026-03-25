import '@testing-library/jest-dom'
import { vi } from 'vitest'

// auto-mock tauri APIs globally
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn(() => Promise.resolve(() => {})) }))
