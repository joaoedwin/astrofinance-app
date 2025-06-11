import { InstallmentOverview } from "@/components/installments/installment-overview"
import { HowItWorksModal } from "@/components/installments/how-it-works-modal"

export default function InstallmentsPage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Parcelamentos</h1>
        <HowItWorksModal type="installments" />
      </div>
      <InstallmentOverview />
    </div>
  )
}
