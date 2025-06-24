"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { useAuthContext } from "@/contexts/auth-context"
import Header from "@/components/header"
import { usePathname } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"

// Forçar renderização dinâmica para evitar problemas com cookies
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Inicializar como fechado em dispositivos móveis
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Definir estado inicial com base no localStorage ou no tipo de dispositivo
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen')
    if (savedState !== null) {
      setSidebarOpen(savedState === 'true')
    } else {
      // Em dispositivos móveis, começar fechado
      setSidebarOpen(!isMobile)
    }
  }, [isMobile])

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString())
  }, [sidebarOpen])

  // Fechar a sidebar após navegação em dispositivos móveis
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto py-0 pb-4">
          {children}
        </main>
      </div>
    </div>
  )
}
