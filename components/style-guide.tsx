"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StyleGuide() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Style Guide - FinanceTrack</CardTitle>
          <CardDescription>Guia de estilo para o aplicativo FinanceTrack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Cores */}
          <div>
            <h3 className="text-lg font-medium mb-4">Cores</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-background border"></div>
                <div className="text-sm">Background</div>
                <div className="text-xs text-muted-foreground">--background</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-foreground"></div>
                <div className="text-sm">Foreground</div>
                <div className="text-xs text-muted-foreground">--foreground</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-primary"></div>
                <div className="text-sm">Primary</div>
                <div className="text-xs text-muted-foreground">--primary</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-secondary"></div>
                <div className="text-sm">Secondary</div>
                <div className="text-xs text-muted-foreground">--secondary</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-muted"></div>
                <div className="text-sm">Muted</div>
                <div className="text-xs text-muted-foreground">--muted</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-accent"></div>
                <div className="text-sm">Accent</div>
                <div className="text-xs text-muted-foreground">--accent</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-destructive"></div>
                <div className="text-sm">Destructive</div>
                <div className="text-xs text-muted-foreground">--destructive</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-full rounded-md bg-border"></div>
                <div className="text-sm">Border</div>
                <div className="text-xs text-muted-foreground">--border</div>
              </div>
            </div>
          </div>

          {/* Tipografia */}
          <div>
            <h3 className="text-lg font-medium mb-4">Tipografia</h3>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold">Heading 1</div>
                <div className="text-xs text-muted-foreground mt-1">text-4xl font-bold</div>
              </div>
              <div>
                <div className="text-3xl font-bold">Heading 2</div>
                <div className="text-xs text-muted-foreground mt-1">text-3xl font-bold</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Heading 3</div>
                <div className="text-xs text-muted-foreground mt-1">text-2xl font-bold</div>
              </div>
              <div>
                <div className="text-xl font-medium">Heading 4</div>
                <div className="text-xs text-muted-foreground mt-1">text-xl font-medium</div>
              </div>
              <div>
                <div className="text-lg font-medium">Heading 5</div>
                <div className="text-xs text-muted-foreground mt-1">text-lg font-medium</div>
              </div>
              <div>
                <div className="text-base">Texto padrão</div>
                <div className="text-xs text-muted-foreground mt-1">text-base</div>
              </div>
              <div>
                <div className="text-sm">Texto pequeno</div>
                <div className="text-xs text-muted-foreground mt-1">text-sm</div>
              </div>
              <div>
                <div className="text-xs">Texto extra pequeno</div>
                <div className="text-xs text-muted-foreground mt-1">text-xs</div>
              </div>
            </div>
          </div>

          {/* Espaçamentos */}
          <div>
            <h3 className="text-lg font-medium mb-4">Espaçamentos</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-4 bg-primary"></div>
                <div className="text-sm">4px (0.25rem)</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-primary"></div>
                <div className="text-sm">8px (0.5rem)</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 bg-primary"></div>
                <div className="text-sm">12px (0.75rem)</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary"></div>
                <div className="text-sm">16px (1rem)</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 bg-primary"></div>
                <div className="text-sm">24px (1.5rem)</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-32 bg-primary"></div>
                <div className="text-sm">32px (2rem)</div>
              </div>
            </div>
          </div>

          {/* Componentes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Componentes</h3>
            <Tabs defaultValue="buttons" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="buttons">Botões</TabsTrigger>
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </TabsList>
              <TabsContent value="buttons" className="space-y-4 pt-4">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <span>+</span>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="inputs" className="space-y-4 pt-4">
                <div className="grid gap-4 max-w-sm">
                  <div className="grid gap-2">
                    <Label htmlFor="input-1">Input padrão</Label>
                    <Input id="input-1" placeholder="Digite algo..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="input-2">Input desabilitado</Label>
                    <Input id="input-2" placeholder="Desabilitado" disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="input-3">Com ícone</Label>
                    <div className="relative">
                      <Input id="input-3" placeholder="Buscar..." className="pl-8" />
                      <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">🔍</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="badges" className="space-y-4 pt-4">
                <div className="flex flex-wrap gap-4">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
