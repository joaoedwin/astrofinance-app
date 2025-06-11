"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialInsights = FinancialInsights;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const ai_actions_1 = require("@/lib/ai-actions");
const skeleton_1 = require("@/components/ui/skeleton");
const alert_1 = require("@/components/ui/alert");
function FinancialInsights({ insights, financialData }) {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [aiInsights, setAiInsights] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)(null);
    const [apiKeyMissing, setApiKeyMissing] = (0, react_1.useState)(false);
    const generateAIInsights = async () => {
        setIsLoading(true);
        setError(null);
        setApiKeyMissing(false);
        try {
            const result = await (0, ai_actions_1.analyzeFinances)(financialData);
            if (Array.isArray(result) && result[0] && typeof result[0] === "string" && result[0].includes("representam")) {
                setApiKeyMissing(true);
            }
            if (Array.isArray(result)) {
                setAiInsights(result);
            }
        }
        catch (error) {
            setError("Não foi possível gerar insights. Tente novamente mais tarde.");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="space-y-6">
      <tabs_1.Tabs defaultValue="insights">
        <tabs_1.TabsList className="grid w-full grid-cols-2">
          <tabs_1.TabsTrigger value="insights">Insights Automáticos</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="ai-insights">Análise por IA</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="insights" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (<card_1.Card key={insight.id} className="overflow-hidden">
                <card_1.CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <badge_1.Badge variant={insight.type === "positive"
                ? "outline"
                : insight.type === "negative"
                    ? "destructive"
                    : "secondary"} className={insight.type === "positive"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                : insight.type === "warning"
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                    : insight.type === "tip"
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                        : ""}>
                      {insight.type === "positive"
                ? "Positivo"
                : insight.type === "negative"
                    ? "Negativo"
                    : insight.type === "warning"
                        ? "Alerta"
                        : "Dica"}
                    </badge_1.Badge>
                    {insight.type === "positive" ? (<lucide_react_1.TrendingUp className="h-5 w-5 text-emerald-500"/>) : insight.type === "negative" ? (<lucide_react_1.TrendingDown className="h-5 w-5 text-rose-500"/>) : insight.type === "warning" ? (<lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-500"/>) : (<lucide_react_1.Lightbulb className="h-5 w-5 text-blue-500"/>)}
                  </div>
                  <card_1.CardTitle className="text-lg">{insight.title}</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </card_1.CardContent>
              </card_1.Card>))}
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="ai-insights" className="space-y-4 pt-4">
          <card_1.Card>
            <card_1.CardHeader>
              <div className="flex items-center gap-2">
                <lucide_react_1.Sparkles className="h-5 w-5 text-primary"/>
                <card_1.CardTitle>Análise Personalizada por IA</card_1.CardTitle>
              </div>
              <card_1.CardDescription>
                Receba insights personalizados sobre seus gastos e recomendações para melhorar sua saúde financeira.
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              {error && (<alert_1.Alert variant="destructive" className="mb-4">
                  <lucide_react_1.AlertTriangle className="h-4 w-4"/>
                  <alert_1.AlertTitle>Erro</alert_1.AlertTitle>
                  <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
                </alert_1.Alert>)}

              {apiKeyMissing && (<alert_1.Alert className="mb-4">
                  <lucide_react_1.Info className="h-4 w-4"/>
                  <alert_1.AlertTitle>Modo de demonstração</alert_1.AlertTitle>
                  <alert_1.AlertDescription>
                    A chave da API OpenAI não está configurada. Os insights exibidos são simulados para demonstração.
                    Para usar a IA real, configure a variável de ambiente OPENAI_API_KEY.
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}

              {aiInsights.length > 0 ? (<div className="space-y-4">
                  {aiInsights.map((insight, index) => (<div key={index} className="flex gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <lucide_react_1.Lightbulb className="h-3 w-3 text-primary"/>
                      </div>
                      <p className="text-sm">{insight}</p>
                    </div>))}
                </div>) : isLoading ? (<div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (<div key={i} className="flex gap-3">
                      <skeleton_1.Skeleton className="h-5 w-5 rounded-full"/>
                      <div className="space-y-2 flex-1">
                        <skeleton_1.Skeleton className="h-4 w-full"/>
                        <skeleton_1.Skeleton className="h-4 w-3/4"/>
                      </div>
                    </div>))}
                </div>) : (<button_1.Button onClick={generateAIInsights} disabled={isLoading}>
                  Gerar Insights com IA
                </button_1.Button>)}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
