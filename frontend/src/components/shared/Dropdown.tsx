import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type DropdownOption = { label: string; value: string }

type DropdownProps = {
  ariaLabel: string
  className?: string
  defaultValue?: string
  name?: string
  onValueChange?: (value: string) => void
  options: DropdownOption[]
  value?: string
}

export function Dropdown({ ariaLabel, className = '', defaultValue, name, onValueChange, options, value }: DropdownProps) {
  const listboxId = `${useId()}-options`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const [open, setOpen] = useState(false)
  const selectedValue = value ?? internalValue
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus()
  }, [activeIndex, open])

  function chooseOption(nextValue: string) {
    setInternalValue(nextValue)
    onValueChange?.(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function moveActiveIndex(direction: number) {
    setActiveIndex((current) => (current + direction + options.length) % options.length)
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(selectedIndex)
      setOpen(true)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseOption(options[activeIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`dropdown ${className}`.trim()} ref={rootRef}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="dropdown-trigger"
        onClick={() => {
          if (open) setOpen(false)
          else {
            setActiveIndex(selectedIndex)
            setOpen(true)
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className="dropdown-value">{selectedOption?.label ?? ''}</span>
        <ChevronDown aria-hidden="true" className={`dropdown-chevron ${open ? 'is-open' : ''}`} size={15} />
      </button>
      {open && (
        <div aria-label={ariaLabel} className="dropdown-menu" id={listboxId} role="listbox">
          {options.map((option, index) => (
            <div
              aria-selected={option.value === selectedValue}
              className={`dropdown-option ${index === activeIndex ? 'is-active' : ''} ${option.value === selectedValue ? 'is-selected' : ''}`}
              id={`${listboxId}-${index}`}
              key={option.value}
              onClick={() => chooseOption(option.value)}
              onKeyDown={handleOptionKeyDown}
              ref={(element) => { optionRefs.current[index] = element }}
              role="option"
              tabIndex={-1}
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <Check aria-hidden="true" size={15} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}