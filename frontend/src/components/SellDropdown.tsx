import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SellDropdownOption {
  value: string
  label: string
}

interface SellDropdownProps {
  id: string
  label: string
  value: string
  options: SellDropdownOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  onChange: (value: string) => void
}

export function SellDropdown({
  id, label, value, options, placeholder = 'Chọn một mục', disabled = false, required = false, onChange,
}: SellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

  useEffect(() => {
    if (isOpen && activeIndex >= 0) optionRefs.current[activeIndex]?.focus()
  }, [activeIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function openAt(index: number) {
    if (disabled || options.length === 0) return
    setActiveIndex(index)
    setIsOpen(true)
  }

  function selectOption(option: SellDropdownOption) {
    onChange(option.value)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const initialIndex = selectedIndex >= 0 ? selectedIndex : event.key === 'ArrowDown' ? 0 : options.length - 1
      openAt(initialIndex)
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index + direction + options.length) % options.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsOpen(false)
    }
  }

  return (
    <div className="sell-dropdown" ref={containerRef} onBlur={handleBlur}>
      <label className="sell-dropdown-label" htmlFor={id}>{label}</label>
      <button
        aria-controls={`${id}-options`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
        className="sell-dropdown-trigger"
        disabled={disabled}
        id={id}
        onClick={() => {
          if (isOpen) setIsOpen(false)
          else openAt(selectedIndex >= 0 ? selectedIndex : 0)
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className={selectedOption ? '' : 'sell-dropdown-placeholder'}>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown aria-hidden="true" size={17} />
      </button>
      {isOpen && (
        <div className="sell-dropdown-options" id={`${id}-options`} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={`sell-dropdown-option${activeIndex === index ? ' sell-dropdown-option-active' : ''}`}
              id={`${id}-option-${index}`}
              key={option.value}
              onClick={() => selectOption(option)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              ref={(element) => { optionRefs.current[index] = element }}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value && <Check aria-hidden="true" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
