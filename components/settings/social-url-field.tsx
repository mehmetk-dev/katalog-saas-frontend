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
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {/* Simge alanın içinde, solda; etiket sade kalır */}
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input
          id={id}
          name={name}
          type="url"
          placeholder={placeholder}
          defaultValue={defaultValue ?? ""}
          onChange={handleChange}
          className={cn(
            "pl-9",
            isDirty && error && "border-destructive focus-visible:ring-destructive/30",
            isDirty && !error && "border-success focus-visible:ring-success/30",
          )}
        />
      </div>
      {isDirty && error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-destructive/20 text-destructive text-center leading-3">!</span>
          {error}
        </p>
      )}
    </div>
  )
}
