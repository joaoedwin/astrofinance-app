"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"

interface CreditCardModalProps {
  trigger?: React.ReactNode
  buttonProps?: React.ComponentProps<typeof Button>
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function CreditCardModal({ 
  trigger, 
  buttonProps, 
  onOpenChange,
  open: controlledOpen
}: CreditCardModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  
  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(open)
    }
    onOpenChange?.(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
            {...buttonProps}
          >
            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Gerenciar</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Gerenciar Cartões
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie seus cartões de crédito.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <CreditCardManager />
        </div>
      </DialogContent>
    </Dialog>
  )
} 