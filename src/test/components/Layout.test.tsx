import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Layout } from '../../components/Layout'

describe('Layout', () => {
  it('renders three panes', () => {
    render(
      <Layout
        sidebar={<div>Sidebar content</div>}
        list={<div>List content</div>}
        detail={<div>Detail content</div>}
      />
    )

    expect(screen.getByText('Sidebar content')).toBeInTheDocument()
    expect(screen.getByText('List content')).toBeInTheDocument()
    expect(screen.getByText('Detail content')).toBeInTheDocument()
  })
})
