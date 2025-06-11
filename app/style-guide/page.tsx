import { StyleGuide } from "@/components/style-guide"

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Style Guide</h1>
      <StyleGuide />
    </div>
  )
}
