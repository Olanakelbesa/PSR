'use client'

import { useEffect, useState } from 'react'
import type { ThemeProviderProps } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider(props: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return props.children
  }

  return <NextThemesProvider {...props}>{props.children}</NextThemesProvider>
}
