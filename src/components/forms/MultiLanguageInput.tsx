'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Globe, ChevronDown, ChevronUp } from 'lucide-react'

interface MultiLanguageValue {
  ru?: string
  en?: string
  kg?: string
  [key: string]: string | undefined
}

interface MultiLanguageInputProps {
  value?: MultiLanguageValue
  onChange?: (value: MultiLanguageValue) => void
  label?: string
  placeholder?: string
  languages?: Array<{ code: string; name: string }>
  primaryLanguage?: string
  multiline?: boolean
  rows?: number
  className?: string
  disabled?: boolean
  required?: boolean
}

const defaultLanguages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'kg', name: 'Кыргызча' },
]

export function MultiLanguageInput({
  value = {},
  onChange,
  label,
  placeholder = '',
  languages = defaultLanguages,
  primaryLanguage = 'ru',
  multiline = false,
  rows = 3,
  className,
  disabled,
  required,
}: MultiLanguageInputProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState(primaryLanguage)

  const handleChange = (lang: string, newValue: string) => {
    const updated = { ...value, [lang]: newValue }
    onChange?.(updated)
  }

  const primaryLang = languages.find(l => l.code === primaryLanguage) || languages[0]
  const secondaryLangs = languages.filter(l => l.code !== primaryLanguage)

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            <Globe className="h-3 w-3 mr-1" />
            {expanded ? 'Скрыть языки' : 'Другие языки'}
            {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      )}

      {/* Primary language input */}
      <div className="relative">
        <InputComponent
          value={value[primaryLanguage] || ''}
          onChange={(e) => handleChange(primaryLanguage, e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={multiline ? rows : undefined}
        />
        <span className="absolute right-2 top-2 text-xs text-muted-foreground bg-background px-1 rounded">
          {primaryLang.name}
        </span>
      </div>

      {/* Secondary languages (collapsible) */}
      {expanded && (
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {secondaryLangs.map(lang => (
            <div key={lang.code} className="relative">
              <InputComponent
                value={value[lang.code] || ''}
                onChange={(e) => handleChange(lang.code, e.target.value)}
                placeholder={`${placeholder} (${lang.name})`}
                disabled={disabled}
                rows={multiline ? rows : undefined}
              />
              <span className="absolute right-2 top-2 text-xs text-muted-foreground bg-background px-1 rounded">
                {lang.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Language tabs for quick switch (alternative view) */}
      {!expanded && secondaryLangs.some(l => value[l.code]) && (
        <div className="flex gap-1 flex-wrap">
          {secondaryLangs.filter(l => value[l.code]).map(lang => (
            <span
              key={lang.code}
              className="text-xs bg-muted px-2 py-0.5 rounded"
              title={value[lang.code]}
            >
              {lang.name}: {(value[lang.code] || '').substring(0, 20)}...
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiLanguageInput
