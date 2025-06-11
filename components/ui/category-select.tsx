"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { PlusCircle, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Category {
  value: string
  label: string
}

interface CategorySelectProps {
  value: string
  onValueChange: (value: string) => void
  categories: Category[]
  onAddCategory?: (category: Category) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  type: string
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  onAddCategory,
  placeholder = "Selecione a categoria",
  className,
  disabled = false,
  type
}: CategorySelectProps) {
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const { toast } = useToast()
  const { token } = useAuthContext()
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    const selected = categories.find(cat => cat.value === value)
    setInputValue(selected ? selected.label : "")
  }, [value, categories])

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showDropdown])

  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedIdx = categories.findIndex(cat => cat.value === value)
      if (selectedIdx >= 0) {
        const item = dropdownRef.current.children[selectedIdx] as HTMLElement
        if (item) item.scrollIntoView({ block: "nearest" })
      }
    }
  }, [showDropdown, value, categories])

  const filteredCategories = inputValue.trim() === "" 
    ? categories 
    : categories.filter((category) =>
        category.label.toLowerCase().includes(inputValue.toLowerCase())
      )
  const exists = categories.some((cat) => cat.label.toLowerCase() === inputValue.toLowerCase())

  const handleSelect = (cat: Category) => {
    onValueChange(cat.value)
    setInputValue(cat.label)
    setShowDropdown(false)
  }

  const handleCreate = async () => {
    if (!inputValue.trim() || exists || loading) return
    
    // Validar o nome da categoria
    if (inputValue.trim().length > 50) {
      toast({
        title: "Nome muito longo",
        description: "O nome da categoria deve ter no máximo 50 caracteres.",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      // Usar tipo 'expense' como padrão
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: inputValue.trim(),
          type: "expense"  // Sempre enviar um tipo válido
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao criar categoria")
      }
      
      const newCategory = await response.json()
      
      // Mapear para o formato esperado pelo componente
      const category: Category = {
        value: newCategory.id,
        label: newCategory.name,
      }
      
      if (onAddCategory) {
        onAddCategory(category)
      }
      
      onValueChange(category.value)
      setInputValue(category.label)
      setShowDropdown(false)
      
      toast({
        title: "Categoria criada",
        description: `A categoria &quot;${newCategory.name}&quot; foi criada com sucesso.`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível criar a categoria"
      console.error("[CategorySelect] Erro ao criar categoria:", error)
      toast({
        title: "Erro ao criar categoria",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.substring(0, 50) // Limitar o comprimento
    setInputValue(newValue)
    setShowDropdown(true)
    
    // Se o valor exato for encontrado, seleciona a categoria
    const found = categories.find(cat => cat.label.toLowerCase() === newValue.toLowerCase())
    if (found) {
      onValueChange(found.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!exists && inputValue.trim()) {
        handleCreate()
      } else if (filteredCategories.length === 1) {
        handleSelect(filteredCategories[0])
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false)
    }
  }

  return (
    <div className={cn("relative h-12", className)}>
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black dark:text-black"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          setShowDropdown(true)
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        style={{ background: inputValue ? "#fff" : undefined }}
      />
      {showDropdown && (inputValue || filteredCategories.length > 0) && (
        <ul ref={dropdownRef} className="absolute z-10 mt-1 w-full bg-background text-foreground border border-border rounded shadow-lg max-h-48 overflow-auto">
          {filteredCategories.map(cat => (
            <li
              key={cat.value}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between text-foreground",
                value === cat.value && "bg-accent text-primary"
              )}
              onClick={() => handleSelect(cat)}
            >
              <span>{cat.label}</span>
              {value === cat.value && <Check className="h-4 w-4 text-primary" />}
            </li>
          ))}
          {!exists && inputValue.trim() && !loading && (
            <li
              className="px-4 py-2 cursor-pointer text-primary flex items-center gap-2 hover:bg-accent text-foreground"
              onClick={handleCreate}
            >
              <PlusCircle className="h-4 w-4" /> Criar &quot;{inputValue}&quot;
            </li>
          )}
          {loading && (
            <li className="px-4 py-2 flex items-center gap-2 text-primary text-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Criando categoria...
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
