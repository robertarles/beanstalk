import { describe, it, expect } from 'vitest'
import type { Bean } from '../../types/beans'

describe('Bean interface', () => {
  it('Bean interface has required fields', () => {
    // TypeScript compile-time check: assigning a complete Bean object
    const bean: Bean = {
      id: 'bean-test-001',
      title: 'Test Bean',
      status: 'open',
      bean_type: 'task',
      parent: null,
      tags: ['test'],
      assignee: 'alice',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      body: 'Body text here.',
      file_path: '/project/.beans/bean-test-001.md',
      children: [],
    }

    expect(bean.id).toBe('bean-test-001')
    expect(bean.title).toBe('Test Bean')
    expect(bean.status).toBe('open')
    expect(bean.bean_type).toBe('task')
    expect(bean.parent).toBeNull()
    expect(bean.tags).toEqual(['test'])
    expect(bean.assignee).toBe('alice')
    expect(bean.created_at).toBe('2024-01-01T00:00:00Z')
    expect(bean.updated_at).toBe('2024-01-02T00:00:00Z')
    expect(bean.body).toBe('Body text here.')
    expect(bean.file_path).toBe('/project/.beans/bean-test-001.md')
    expect(bean.children).toEqual([])
  })
})
