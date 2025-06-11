import { redirect } from "next/navigation"
import { CreditCardManager } from "@/components/credit-card/credit-card-manager"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function HomePage() {
  redirect("/login")
}
