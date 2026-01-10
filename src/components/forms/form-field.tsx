'use client'

import * as React from 'react'
import { UseFormRegister, FieldError } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  register?: UseFormRegister<any>
  error?: FieldError
  description?: string
  required?: boolean
}

export function FormField({
  label,
  name,
  register,
  error,
  description,
  required,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
        {label}
      </Label>
      <Input
        id={name}
        {...(register ? register(name) : {})}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}