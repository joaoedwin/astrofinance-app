"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettings = AppSettings;
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const label_1 = require("@/components/ui/label");
const switch_1 = require("@/components/ui/switch");
const select_1 = require("@/components/ui/select");
function AppSettings() {
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle>Configurações do Aplicativo</card_1.CardTitle>
        <card_1.CardDescription>Personalize a experiência do seu aplicativo de controle financeiro.</card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Preferências</h3>
            <p className="text-sm text-muted-foreground">Ajuste as configurações gerais do aplicativo.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label_1.Label htmlFor="notifications">Notificações</label_1.Label>
                <p className="text-sm text-muted-foreground">Receba alertas sobre suas finanças.</p>
              </div>
              <switch_1.Switch id="notifications" defaultChecked/>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label_1.Label htmlFor="email-alerts">Alertas por email</label_1.Label>
                <p className="text-sm text-muted-foreground">Receba resumos semanais por email.</p>
              </div>
              <switch_1.Switch id="email-alerts"/>
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
              <label_1.Label htmlFor="currency">Moeda</label_1.Label>
              <select_1.Select defaultValue="BRL">
                <select_1.SelectTrigger id="currency">
                  <select_1.SelectValue placeholder="Selecione a moeda"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="BRL">Real (R$)</select_1.SelectItem>
                  <select_1.SelectItem value="USD">Dólar (US$)</select_1.SelectItem>
                  <select_1.SelectItem value="EUR">Euro (€)</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="grid gap-2">
              <label_1.Label htmlFor="date-format">Formato de data</label_1.Label>
              <select_1.Select defaultValue="DD/MM/YYYY">
                <select_1.SelectTrigger id="date-format">
                  <select_1.SelectValue placeholder="Selecione o formato"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="DD/MM/YYYY">DD/MM/AAAA</select_1.SelectItem>
                  <select_1.SelectItem value="MM/DD/YYYY">MM/DD/AAAA</select_1.SelectItem>
                  <select_1.SelectItem value="YYYY-MM-DD">AAAA-MM-DD</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="grid gap-2">
              <label_1.Label htmlFor="start-week">Início da semana</label_1.Label>
              <select_1.Select defaultValue="sunday">
                <select_1.SelectTrigger id="start-week">
                  <select_1.SelectValue placeholder="Selecione o dia"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="sunday">Domingo</select_1.SelectItem>
                  <select_1.SelectItem value="monday">Segunda-feira</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
          </div>
        </div>
      </card_1.CardContent>
      <card_1.CardFooter>
        <button_1.Button>Salvar configurações</button_1.Button>
      </card_1.CardFooter>
    </card_1.Card>);
}
