import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FinanceTrack - Controle Financeiro Pessoal",
  description: "Aplicativo de controle financeiro pessoal",
  generator: 'v0.dev'
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
          <Script id="remove-cz-attribute" strategy="beforeInteractive">
            {`
              (function() {
                setTimeout(function() {
                  if (document.body && document.body.hasAttribute('cz-shortcut-listen')) {
                    document.body.removeAttribute('cz-shortcut-listen');
                  }
                }, 0);
              })();
            `}
          </Script>
      </body>
    </html>
  )
}
