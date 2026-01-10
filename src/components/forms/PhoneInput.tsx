'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Country {
  id: number
  code: string
  nameRu: string
  phoneCode: string | null
  flagEmoji: string | null
}

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  defaultCountryCode?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  name?: string
}

const defaultCountries: Country[] = [
  { id: 1, code: 'KG', nameRu: 'Кыргызстан', phoneCode: '+996', flagEmoji: '🇰🇬' },
  { id: 2, code: 'RU', nameRu: 'Россия', phoneCode: '+7', flagEmoji: '🇷🇺' },
  { id: 3, code: 'KZ', nameRu: 'Казахстан', phoneCode: '+7', flagEmoji: '🇰🇿' },
  { id: 4, code: 'UZ', nameRu: 'Узбекистан', phoneCode: '+998', flagEmoji: '🇺🇿' },
  { id: 5, code: 'TJ', nameRu: 'Таджикистан', phoneCode: '+992', flagEmoji: '🇹🇯' },
]

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = '',
  onChange,
  defaultCountryCode = 'KG',
  placeholder = 'XXX XXX XXX',
  className,
  disabled,
  required,
  name,
}, ref) => {
  const [countries, setCountries] = useState<Country[]>(defaultCountries)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    // Try to load countries from API
    fetch('/api/v1/geolocation/countries')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const countriesWithPhone = data.data.filter((c: Country) => c.phoneCode)
          if (countriesWithPhone.length > 0) {
            setCountries(countriesWithPhone)
          }
        }
      })
      .catch(() => {
        // Keep default countries
      })
  }, [])

  useEffect(() => {
    // Set default country
    const defaultC = countries.find(c => c.code === defaultCountryCode) || countries[0]
    if (defaultC && !selectedCountry) {
      setSelectedCountry(defaultC)
    }
  }, [countries, defaultCountryCode])

  useEffect(() => {
    // Parse incoming value
    if (value && !phoneNumber) {
      const country = countries.find(c => value.startsWith(c.phoneCode || ''))
      if (country) {
        setSelectedCountry(country)
        setPhoneNumber(value.replace(country.phoneCode || '', '').trim())
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value, countries])

  const handleCountryChange = (code: string) => {
    const country = countries.find(c => c.code === code)
    if (country) {
      setSelectedCountry(country)
      emitChange(country.phoneCode || '', phoneNumber)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s]/g, '')
    setPhoneNumber(val)
    emitChange(selectedCountry?.phoneCode || '', val)
  }

  const emitChange = (code: string, number: string) => {
    const fullNumber = `${code} ${number}`.trim()
    onChange?.(fullNumber)
  }

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Select
        value={selectedCountry?.code}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue>
            {selectedCountry && (
              <span className="flex items-center gap-1">
                <span>{selectedCountry.flagEmoji}</span>
                <span className="text-sm">{selectedCountry.phoneCode}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {countries.map(country => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flagEmoji}</span>
                <span>{country.phoneCode}</span>
                <span className="text-muted-foreground text-sm">{country.nameRu}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        ref={ref}
        type="tel"
        value={formatPhone(phoneNumber)}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        className="flex-1"
      />
    </div>
  )
})

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
