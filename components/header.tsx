"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const isMobile = useMobile()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-background px-2 sm:px-4 md:px-6">
      <div className="flex items-center gap-1 sm:gap-2">
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="md:hidden -ml-1 h-8 w-8">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs sm:text-sm">FT</span>
          </div>
          <span className="font-bold text-sm sm:text-base hidden md:inline-block">FinanceTrack</span>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  )
}
