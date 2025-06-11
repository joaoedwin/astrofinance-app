"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SessionExpiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessão Expirada</DialogTitle>
          <DialogDescription>
            Sua sessão expirou. Por favor, faça login novamente para continuar.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
} 