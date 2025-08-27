'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
}

export function Dropdown({ trigger, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleTriggerClick = (e: React.MouseEvent) => {
    console.log('🟡 Dropdown trigger clicked, current state:', isOpen)
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={handleTriggerClick}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  onClick: (e: React.MouseEvent) => void
  children: ReactNode
  className?: string
}

export function DropdownItem({ onClick, children, className }: DropdownItemProps) {
  return (
    <div
      className={className || "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"}
      role="menuitem"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick(e)
      }}
    >
      {children}
    </div>
  )
}
