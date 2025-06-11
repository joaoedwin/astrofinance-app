"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AppSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Aplicativo</CardTitle>
        <CardDescription>Personalize a experiência do seu aplicativo de controle financeiro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Preferências</h3>
            <p className="text-sm text-muted-foreground">Ajuste as configurações gerais do aplicativo.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notificações</Label>
                <p className="text-sm text-muted-foreground">Receba alertas sobre suas finanças.</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-alerts">Alertas por email</Label>
                <p className="text-sm text-muted-foreground">Receba resumos semanais por email.</p>
              </div>
              <Switch id="email-alerts" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Exibição</h3>
            <p className="text-sm text-muted-foreground">Personalize como os dados são exibidos.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select defaultValue="BRL">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-format">Formato de data</Label>
              <Select defaultValue="DD/MM/YYYY">
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-week">Início da semana</Label>
              <Select defaultValue="sunday">
                <SelectTrigger id="start-week">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Domingo</SelectItem>
                  <SelectItem value="monday">Segunda-feira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Salvar configurações</Button>
      </CardFooter>
    </Card>
  )
}
