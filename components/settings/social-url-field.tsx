"use client"

import { useState } from "react"
import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SocialUrlFieldProps {
  id: string
  name: string
  label: string
  icon: React.ReactNode
  placeholder: string
  defaultValue?: string | null
  validate: (value: string) => string | null
}

export function SocialUrlField({
  id,
  name,
  label,
  icon,
  placeholder,
  defaultValue,
  validate,
}: SocialUrlFieldProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim()
    setIsDirty(true)
    setError(value ? validate(value) : null)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-2 text-foreground">
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type="url"
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        onChange={handleChange}
        className={cn(
          "bg-background border-input focus:bg-background transition-colors",
          isDirty && error && "border-destructive focus-visible:ring-destructive/30",
          isDirty && !error && "border-green-500 focus-visible:ring-green-500/30",
        )}
      />
      {isDirty && error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-destructive/20 text-destructive text-center leading-3">!</span>
          {error}
        </p>
      )}
    </div>
  )
}
