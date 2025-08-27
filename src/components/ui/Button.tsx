import React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    icon: Icon, 
    iconPosition = 'left',
    loading = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          'btn',
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'btn-ghost': variant === 'ghost',
            'btn-sm': size === 'sm',
            'btn-md': size === 'md',
            'btn-lg': size === 'lg',
            'bg-error-600 text-white hover:bg-error-700': variant === 'danger',
            'opacity-50 cursor-not-allowed': isDisabled,
          },
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className={cn('h-4 w-4', children && 'mr-2')} />
        )}
        
        {children}
        
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className={cn('h-4 w-4', children && 'ml-2')} />
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'