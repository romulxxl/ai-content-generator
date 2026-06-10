import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagInput from '@/components/generate/TagInput'

function setup(props: Partial<Parameters<typeof TagInput>[0]> = {}) {
  const onChange = vi.fn()
  const tags = props.tags ?? []
  render(<TagInput tags={tags} onChange={onChange} {...props} onChange={onChange} />)
  const input = screen.getByRole('textbox')
  return { input, onChange }
}

describe('TagInput', () => {
  it('renders the placeholder when no tags', () => {
    setup({ placeholder: 'Add feature' })
    expect(screen.getByPlaceholderText('Add feature')).toBeInTheDocument()
  })

  it('hides placeholder when tags exist', () => {
    setup({ tags: ['one'], placeholder: 'Add feature' })
    expect(screen.queryByPlaceholderText('Add feature')).not.toBeInTheDocument()
  })

  it('renders existing tags', () => {
    setup({ tags: ['alpha', 'beta'] })
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('adds tag on Enter', async () => {
    const { input, onChange } = setup({ tags: [] })
    await userEvent.type(input, 'new-tag{Enter}')
    expect(onChange).toHaveBeenCalledWith(['new-tag'])
  })

  it('adds tag on comma', async () => {
    const { input, onChange } = setup({ tags: [] })
    await userEvent.type(input, 'comma-tag,')
    expect(onChange).toHaveBeenCalledWith(['comma-tag'])
  })

  it('trims whitespace when adding', async () => {
    const { input, onChange } = setup({ tags: [] })
    await userEvent.type(input, '  spaced  {Enter}')
    expect(onChange).toHaveBeenCalledWith(['spaced'])
  })

  it('does not add duplicate tags', async () => {
    const { input, onChange } = setup({ tags: ['existing'] })
    await userEvent.type(input, 'existing{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not add empty tag', async () => {
    const { input, onChange } = setup({ tags: [] })
    await userEvent.type(input, '   {Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('respects maxTags limit', async () => {
    const { input, onChange } = setup({ tags: ['a', 'b'], maxTags: 2 })
    await userEvent.type(input, 'c{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('truncates tag to maxTagLength', async () => {
    const { input, onChange } = setup({ tags: [], maxTagLength: 5 })
    await userEvent.type(input, 'toolongtag{Enter}')
    const call = onChange.mock.calls[0][0][0] as string
    expect(call.length).toBeLessThanOrEqual(5)
    expect(call).toBe('toolo')
  })

  it('removes tag when X button clicked', async () => {
    const onChange = vi.fn()
    render(<TagInput tags={['remove-me', 'keep']} onChange={onChange} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalledWith(['keep'])
  })

  it('removes last tag on Backspace when input is empty', async () => {
    const { input, onChange } = setup({ tags: ['first', 'second'] })
    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')
    expect(onChange).toHaveBeenCalledWith(['first'])
  })

  it('does not remove on Backspace when input has value', async () => {
    const { input, onChange } = setup({ tags: ['keep'] })
    await userEvent.type(input, 'typing')
    await userEvent.keyboard('{Backspace}')
    // Backspace just deletes last char of input, onChange not called for removal
    expect(onChange).not.toHaveBeenCalled()
  })

  it('adds tag on blur when input has value', async () => {
    const { input, onChange } = setup({ tags: [] })
    await userEvent.click(input)
    await userEvent.type(input, 'blur-tag')
    await userEvent.tab()
    expect(onChange).toHaveBeenCalledWith(['blur-tag'])
  })
})
