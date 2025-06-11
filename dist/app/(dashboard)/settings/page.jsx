"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsPage;
const tabs_1 = require("@/components/ui/tabs");
const profile_settings_1 = require("@/components/settings/profile-settings");
const category_settings_1 = require("@/components/settings/category-settings");
const app_settings_1 = require("@/components/settings/app-settings");
const navigation_1 = require("next/navigation");
function SettingsPage() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const tab = searchParams.get("tab") || "profile";
    return (<div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      <tabs_1.Tabs defaultValue={tab} className="space-y-4">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="profile">Perfil</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="categories">Categorias</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="app">Aplicativo</tabs_1.TabsTrigger>
        </tabs_1.TabsList>
        <tabs_1.TabsContent value="profile">
          <profile_settings_1.ProfileSettings />
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="categories">
          <category_settings_1.CategorySettings />
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="app">
          <app_settings_1.AppSettings />
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
