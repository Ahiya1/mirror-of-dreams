'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PasswordToggle } from '@/components/ui/PasswordToggle'
import type { GlassInputProps } from '@/types/glass-components'
import { inputFocusVariants, characterCounterVariants, wordCounterVariants } from '@/lib/animations/variants'
import { countWords } from '@/lib/utils/wordCount'

export function GlassInput({
  type = 'text',
  variant,
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  counterMode = 'characters',
  counterFormat,
  showPasswordToggle = false,
  label,
  error,
  success = false,
  required = false,
  minLength,
  autoComplete,
  id,
  className,
  rows = 5,
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const prevErrorRef = useRef<string | undefined>()
  const prefersReducedMotion = useReducedMotion()

  // Trigger shake animation on error state change (not every render)
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      setIsShaking(true)
      const timer = setTimeout(() => setIsShaking(false), 400)
      prevErrorRef.current = error
      return () => clearTimeout(timer)
    }
    if (!error) {
      prevErrorRef.current = undefined
    }
  }, [error])

  // Determine actual type - support backward compatibility with variant prop
  const actualType = variant === 'textarea' ? 'textarea' : type
  const inputType = actualType === 'password' && showPassword ? 'text' : actualType

  // Word or character count calculation
  const displayCount = counterMode === 'words' ? countWords(value) : value.length

  // Character counter color state logic (for character mode)
  const getCounterColorState = () => {
    if (!maxLength) return 'safe'
    const percentage = value.length / maxLength
    if (percentage > 0.9) return 'danger'   // Over 90%
    if (percentage > 0.7) return 'warning'  // Over 70%
    return 'safe'                           // Under 70%
  }

  // Word counter color state logic (for word mode)
  const getWordCounterState = (): 'low' | 'mid' | 'high' => {
    if (!maxLength) return 'low'
    const estimatedMaxWords = maxLength / 5 // Average word length
    const percentage = displayCount / estimatedMaxWords
    if (percentage < 0.5) return 'low'   // 0-50%: white
    if (percentage < 0.9) return 'mid'   // 50-90%: gold
    return 'high'                         // 90-100%: purple
  }

  // Get counter text (custom format or default)
  const getCounterText = () => {
    if (counterFormat) {
      return counterFormat(displayCount, maxLength || 0)
    }
    if (counterMode === 'words') {
      if (displayCount === 0) return 'Your thoughts await...'
      if (displayCount === 1) return '1 thoughtful word'
      return `${displayCount} thoughtful words`
    }
    return `${value.length} / ${maxLength}`
  }

  const baseClasses = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-white/5 backdrop-blur-sm',
    'border-2 transition-all duration-300',
    'text-white placeholder:text-white/40',
    'focus:outline-none',
    'focus:scale-[1.01]',
    'font-inherit',
    // Border states (error > success > focus > default)
    error
      ? 'border-mirror-error/50'
      : success
      ? 'border-mirror-success/50'
      : isFocused
      ? 'border-mirror-purple/60'
      : 'border-white/10',
    // Focus states
    error
      ? 'focus:border-mirror-error'
      : success
      ? 'focus:border-mirror-success'
      : 'focus:border-mirror-purple/60',
    actualType === 'textarea' && 'resize-vertical',
    // Add padding for password toggle or success checkmark
    (actualType === 'password' && showPasswordToggle) || success ? 'pr-12' : '',
    // Error shake animation
    isShaking && 'animate-shake',
    className
  )

  const Component = actualType === 'textarea' ? motion.textarea : motion.input

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm text-white/70 font-medium block">
          {label}
          {required && <span className="text-mirror-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Component
          id={id}
          type={actualType === 'textarea' ? undefined : inputType}
          className={baseClasses}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
          // Apply focus glow animation (respects reduced motion)
          variants={prefersReducedMotion ? undefined : inputFocusVariants}
          initial={prefersReducedMotion ? false : 'rest'}
          animate={prefersReducedMotion ? false : (isFocused ? 'focus' : 'rest')}
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

        {/* Success Checkmark */}
        {success && !error && actualType !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-mirror-success"
              aria-hidden="true"
            >
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
              />
              <path
                d="M6 10 L9 13 L14 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="100"
                className="animate-checkmark"
              />
            </svg>
          </div>
        )}

        {/* Character/Word Counter with color shift animation */}
        {showCounter && maxLength && actualType === 'textarea' && (
          <motion.div
            className="absolute bottom-3 right-3 text-xs pointer-events-none font-medium"
            variants={prefersReducedMotion ? undefined : (counterMode === 'words' ? wordCounterVariants : characterCounterVariants)}
            initial={prefersReducedMotion ? false : (counterMode === 'words' ? 'low' : 'safe')}
            animate={prefersReducedMotion ? false : (counterMode === 'words' ? getWordCounterState() : getCounterColorState())}
            aria-live="polite"
            aria-atomic="true"
          >
            {getCounterText()}
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-mirror-error flex items-center gap-1">
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}
