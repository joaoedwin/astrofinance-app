"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Import,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  X,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { NewTransactionButton } from "@/components/transactions/new-transaction-button"
import { useAuthContext } from "@/contexts/auth-context"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)
  const { logout, user } = useAuthContext()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Transações",
      icon: CreditCard,
      href: "/transactions",
      active: pathname === "/transactions",
    },
    {
      label: "Parcelamentos",
      icon: Calendar,
      href: "/installments",
      active: pathname === "/installments",
    },
    {
      label: "Fatura Mensal",
      icon: FileText,
      href: "/invoice",
      active: pathname === "/invoice",
    },
    {
      label: "Metas",
      icon: BarChart3,
      href: "/goals",
      active: pathname === "/goals",
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
    // Adiciona o link de administração apenas para usuários admin
    ...(user?.role === "admin" ? [
      {
        label: "Administração",
        icon: Shield,
        href: "/admin",
        active: pathname === "/admin",
      }
    ] : []),
  ]

  const SidebarContent = (
    <>
      <div className="flex h-12 sm:h-14 items-center border-b px-2 sm:px-4">
        <Link href="/dashboard" className="flex items-center gap-1 sm:gap-2">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs sm:text-sm">FT</span>
          </div>
          {(open || isMobile) && <span className="font-bold text-sm sm:text-base">FinanceTrack</span>}
        </Link>
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="ml-auto h-7 w-7 sm:h-8 sm:w-8">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        )}
        {!isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="ml-auto h-7 w-7 sm:h-8 sm:w-8">
            {open ? <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-1 sm:px-2 py-2 sm:py-4">
        <div className="mb-2 sm:mb-4 px-1 sm:px-2">
          {open || isMobile ? <NewTransactionButton fullWidth /> : <NewTransactionButton iconOnly />}
        </div>
        <div className="space-y-0.5 sm:space-y-1 px-1 sm:px-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={route.active ? "secondary" : "ghost"}
              size="sm"
              className={cn("w-full justify-start h-8 sm:h-9 text-xs sm:text-sm", {
                "bg-secondary": route.active,
                "px-2": !open && !isMobile,
              })}
              asChild
            >
              <Link href={route.href}>
                <route.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", open || isMobile ? "mr-2" : "")} />
                {(open || isMobile) && route.label}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto border-t p-2 sm:p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm" 
          onClick={logout}
        >
          <LogOut className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", open || isMobile ? "mr-2" : "")} />
          {(open || isMobile) && "Sair"}
        </Button>
      </div>
    </>
  )

  // Mobile: Sheet component
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 sm:w-[280px]">
          <div className="flex h-full flex-col">{SidebarContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Regular sidebar
  return (
    <div
      className={cn("flex flex-col h-screen border-r bg-sidebar transition-all duration-300", {
        "w-[280px]": open,
        "w-[70px]": !open,
      })}
    >
      {SidebarContent}
    </div>
  )
}
