'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

interface GlassInputProps {
  variant?: 'text' | 'textarea'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  showCounter?: boolean
  label?: string
  className?: string
  rows?: number
}

export function GlassInput({
  variant = 'text',
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  label,
  className,
  rows = 5,
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const baseClasses = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-white/5 backdrop-blur-sm',
    'border-2 transition-all duration-300',
    'text-white placeholder:text-white/40',
    'focus:outline-none',
    'focus:scale-[1.01]',
    'font-inherit',
    isFocused
      ? 'border-mirror-purple/60 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
      : 'border-white/10',
    variant === 'textarea' && 'resize-vertical',
    className
  )

  const Component = variant === 'textarea' ? 'textarea' : 'input'

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-white/70 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <Component
          className={baseClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          {...(variant === 'textarea' && {
            rows: rows,
          })}
        />
        {showCounter && maxLength && (
          <div className="absolute bottom-3 right-3 text-xs text-white/40 pointer-events-none">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
    </div>
  )
}
