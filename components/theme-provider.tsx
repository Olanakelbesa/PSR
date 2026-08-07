'use client'

import * as React from 'react'
import type { ThemeProviderProps } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      enableSystem={false}
      scriptProps={{ id: 'next-themes-script' }}
    >
      {children}
    </NextThemesProvider>
  )
}
