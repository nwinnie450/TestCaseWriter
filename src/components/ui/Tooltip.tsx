'use client'

import React, { useState, useRef, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    
    let x = rect.left + rect.width / 2
    let y = rect.top
    
    switch (position) {
      case 'bottom':
        y = rect.bottom + 8
        break
      case 'top':
        y = rect.top - 8
        break
      case 'left':
        x = rect.left - 8
        y = rect.top + rect.height / 2
        break
      case 'right':
        x = rect.right + 8
        y = rect.top + rect.height / 2
        break
    }
    
    setCoords({ x, y })
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative ${className}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: position === 'top' || position === 'bottom' 
              ? 'translateX(-50%)' 
              : position === 'left' 
              ? 'translateX(-100%) translateY(-50%)'
              : 'translateY(-50%)'
          }}
        >
          {content}
          <div
            className={`absolute w-1 h-1 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'bottom-0 left-1/2 translate-x-[-2px] translate-y-[2px]' :
              position === 'bottom' ? 'top-0 left-1/2 translate-x-[-2px] translate-y-[-2px]' :
              position === 'left' ? 'right-0 top-1/2 translate-x-[2px] translate-y-[-2px]' :
              'left-0 top-1/2 translate-x-[-2px] translate-y-[-2px]'
            }`}
          />
        </div>
      )}
    </>
  )
}