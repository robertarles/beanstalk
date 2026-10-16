import type { Bean } from '../types/beans';

/**
 * Flatten a bean tree into a flat list, depth-first.
 *
 * Shared rather than duplicated: `ParentBeanSelect`, `RelatedBeansSelect` and the
 * wikilink resolver all need it, and three copies would drift.
 */
export function flattenBeans(beans: Bean[]): Bean[] {
  const result: Bean[] = [];
  function walk(nodes: Bean[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  }
  walk(beans);
  return result;
}

/** Recursively search a bean tree for a bean with the given id. */
export function findBeanById(beans: Bean[], id: string): Bean | null {
  for (const bean of beans) {
    if (bean.id === id) return bean;
    if (bean.children && bean.children.length > 0) {
      const found = findBeanById(bean.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Where the 🛑 badge should navigate.
 *
 * With exactly one relation, jump straight to it. With several, the row has no
 * room to offer each one, and picking `blocked_by[0]` silently made every other
 * relation unreachable from the list — so select the bean itself instead, whose
 * detail pane lists all of them as clickable badges.
 */
export function relationTarget(bean: Bean): string {
  const related = [...bean.blocked_by, ...bean.blocking];
  return related.length === 1 ? related[0] : bean.id;
}
