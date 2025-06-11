"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { CategorySettings } from "@/components/settings/category-settings"
import { AppSettings } from "@/components/settings/app-settings"
import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "profile"
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Configurações</h1>
      <Tabs defaultValue={tab} className="space-y-3 sm:space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-auto">
          <TabsTrigger value="profile" className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">Perfil</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">Categorias</TabsTrigger>
          <TabsTrigger value="app" className="text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">Aplicativo</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-3 sm:mt-4">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="categories" className="mt-3 sm:mt-4">
          <CategorySettings />
        </TabsContent>
        <TabsContent value="app" className="mt-3 sm:mt-4">
          <AppSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
} 