"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ReactNode } from "react"

interface ExtendedThemeProviderProps {
  children: ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ children, ...props }: ExtendedThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
