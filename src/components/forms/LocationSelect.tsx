'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Country {
  id: number
  code: string
  nameRu: string
  nameEn: string
  flagEmoji: string | null
}

interface Region {
  id: number
  nameRu: string | null
  nameEn: string | null
  title: string | null
}

interface City {
  id: number
  nameRu: string
  nameEn: string | null
  isCapital: boolean
}

interface LocationSelectProps {
  countryId?: number | null
  regionId?: number | null
  cityId?: number | null
  onCountryChange?: (id: number | null) => void
  onRegionChange?: (id: number | null) => void
  onCityChange?: (id: number | null) => void
  locale?: 'ru' | 'en'
  className?: string
  showLabels?: boolean
  disabled?: boolean
  required?: boolean
}

export function LocationSelect({
  countryId,
  regionId,
  cityId,
  onCountryChange,
  onRegionChange,
  onCityChange,
  locale = 'ru',
  className,
  showLabels = true,
  disabled,
  required,
}: LocationSelectProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Load countries
  useEffect(() => {
    setLoadingCountries(true)
    fetch('/api/v1/geolocation/countries')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCountries(data.data)
        }
      })
      .finally(() => setLoadingCountries(false))
  }, [])

  // Load regions when country changes
  useEffect(() => {
    if (countryId) {
      setLoadingRegions(true)
      fetch(`/api/v1/geolocation/countries/${countryId}/regions`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRegions(data.data)
          }
        })
        .finally(() => setLoadingRegions(false))
    } else {
      setRegions([])
    }
  }, [countryId])

  // Load cities when region changes
  useEffect(() => {
    if (regionId) {
      setLoadingCities(true)
      fetch(`/api/v1/geolocation/regions/${regionId}/cities`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCities(data.data)
          }
        })
        .finally(() => setLoadingCities(false))
    } else {
      setCities([])
    }
  }, [regionId])

  const handleCountryChange = (value: string) => {
    const id = value === 'none' ? null : parseInt(value)
    onCountryChange?.(id)
    onRegionChange?.(null)
    onCityChange?.(null)
  }

  const handleRegionChange = (value: string) => {
    const id = value === 'none' ? null : parseInt(value)
    onRegionChange?.(id)
    onCityChange?.(null)
  }

  const handleCityChange = (value: string) => {
    const id = value === 'none' ? null : parseInt(value)
    onCityChange?.(id)
  }

  const getRegionName = (region: Region) => {
    if (locale === 'en' && region.nameEn) return region.nameEn
    if (region.nameRu) return region.nameRu
    if (region.title) {
      try {
        const parsed = typeof region.title === 'string' ? JSON.parse(region.title) : region.title
        return parsed[locale] || parsed.ru || region.title
      } catch {
        return region.title
      }
    }
    return `Region ${region.id}`
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {/* Country Select */}
      <div className="space-y-2">
        {showLabels && <Label>{locale === 'en' ? 'Country' : 'Страна'}</Label>}
        <Select
          value={countryId?.toString() || 'none'}
          onValueChange={handleCountryChange}
          disabled={disabled || loadingCountries}
        >
          <SelectTrigger>
            <SelectValue placeholder={locale === 'en' ? 'Select country' : 'Выберите страну'} />
          </SelectTrigger>
          <SelectContent>
            {!required && (
              <SelectItem value="none">
                {locale === 'en' ? 'Not selected' : 'Не выбрано'}
              </SelectItem>
            )}
            {countries.map(country => (
              <SelectItem key={country.id} value={country.id.toString()}>
                <span className="flex items-center gap-2">
                  {country.flagEmoji && <span>{country.flagEmoji}</span>}
                  <span>{locale === 'en' ? country.nameEn : country.nameRu}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region Select */}
      <div className="space-y-2">
        {showLabels && <Label>{locale === 'en' ? 'Region' : 'Регион'}</Label>}
        <Select
          value={regionId?.toString() || 'none'}
          onValueChange={handleRegionChange}
          disabled={disabled || !countryId || loadingRegions}
        >
          <SelectTrigger>
            <SelectValue placeholder={locale === 'en' ? 'Select region' : 'Выберите регион'} />
          </SelectTrigger>
          <SelectContent>
            {!required && (
              <SelectItem value="none">
                {locale === 'en' ? 'Not selected' : 'Не выбрано'}
              </SelectItem>
            )}
            {regions.map(region => (
              <SelectItem key={region.id} value={region.id.toString()}>
                {getRegionName(region)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Select */}
      <div className="space-y-2">
        {showLabels && <Label>{locale === 'en' ? 'City' : 'Город'}</Label>}
        <Select
          value={cityId?.toString() || 'none'}
          onValueChange={handleCityChange}
          disabled={disabled || !regionId || loadingCities}
        >
          <SelectTrigger>
            <SelectValue placeholder={locale === 'en' ? 'Select city' : 'Выберите город'} />
          </SelectTrigger>
          <SelectContent>
            {!required && (
              <SelectItem value="none">
                {locale === 'en' ? 'Not selected' : 'Не выбрано'}
              </SelectItem>
            )}
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id.toString()}>
                <span className="flex items-center gap-2">
                  <span>{locale === 'en' ? city.nameEn || city.nameRu : city.nameRu}</span>
                  {city.isCapital && (
                    <span className="text-xs text-muted-foreground">
                      ({locale === 'en' ? 'capital' : 'столица'})
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default LocationSelect
