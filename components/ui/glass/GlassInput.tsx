'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { PasswordToggle } from '@/components/ui/PasswordToggle'
import type { GlassInputProps } from '@/types/glass-components'

export function GlassInput({
  type = 'text',
  variant,
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  showPasswordToggle = false,
  label,
  error,
  required = false,
  minLength,
  autoComplete,
  id,
  className,
  rows = 5,
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Determine actual type - support backward compatibility with variant prop
  const actualType = variant === 'textarea' ? 'textarea' : type
  const inputType = actualType === 'password' && showPassword ? 'text' : actualType

  const baseClasses = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-white/5 backdrop-blur-sm',
    'border-2 transition-all duration-300',
    'text-white placeholder:text-white/40',
    'focus:outline-none',
    'focus:scale-[1.01]',
    'font-inherit',
    // Error state
    error
      ? 'border-red-500/50'
      : isFocused
      ? 'border-mirror-purple/60 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
      : 'border-white/10',
    actualType === 'textarea' && 'resize-vertical',
    // Add padding for password toggle
    actualType === 'password' && showPasswordToggle && 'pr-12',
    className
  )

  const Component = actualType === 'textarea' ? 'textarea' : 'input'

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm text-white/70 font-medium block">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Component
          id={id}
          type={actualType === 'textarea' ? undefined : inputType}
          className={baseClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
          {...(actualType === 'textarea' && {
            rows: rows,
          })}
        />

        {/* Password Toggle */}
        {actualType === 'password' && showPasswordToggle && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
        )}

        {/* Character Counter */}
        {showCounter && maxLength && actualType === 'textarea' && (
          <div className="absolute bottom-3 right-3 text-xs text-white/40 pointer-events-none">
            {value.length} / {maxLength}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
