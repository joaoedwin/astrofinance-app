"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, Sparkles, Info } from "lucide-react"
import { analyzeFinances } from "@/lib/ai-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Insight {
  id: string
  type: "positive" | "negative" | "warning" | "tip"
  title: string
  description: string
}

interface FinancialInsightsProps {
  insights: Insight[]
  financialData: any
}

export function FinancialInsights({ insights, financialData }: FinancialInsightsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  const generateAIInsights = async () => {
    setIsLoading(true)
    setError(null)
    setApiKeyMissing(false)

    try {
      const result = await analyzeFinances(financialData)
      if (Array.isArray(result) && result[0] && typeof result[0] === "string" && result[0].includes("representam")) {
        setApiKeyMissing(true)
      }
      if (Array.isArray(result)) {
        setAiInsights(result)
      }
    } catch (error) {
      setError("Não foi possível gerar insights. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="insights">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">Insights Automáticos</TabsTrigger>
          <TabsTrigger value="ai-insights">Análise por IA</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (
              <Card key={insight.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        insight.type === "positive"
                          ? "outline"
                          : insight.type === "negative"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        insight.type === "positive"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : insight.type === "warning"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                            : insight.type === "tip"
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-50"
                              : ""
                      }
                    >
                      {insight.type === "positive"
                        ? "Positivo"
                        : insight.type === "negative"
                          ? "Negativo"
                          : insight.type === "warning"
                            ? "Alerta"
                            : "Dica"}
                    </Badge>
                    {insight.type === "positive" ? (
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    ) : insight.type === "negative" ? (
                      <TrendingDown className="h-5 w-5 text-rose-500" />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Lightbulb className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Análise Personalizada por IA</CardTitle>
              </div>
              <CardDescription>
                Receba insights personalizados sobre seus gastos e recomendações para melhorar sua saúde financeira.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {apiKeyMissing && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Modo de demonstração</AlertTitle>
                  <AlertDescription>
                    A chave da API OpenAI não está configurada. Os insights exibidos são simulados para demonstração.
                    Para usar a IA real, configure a variável de ambiente OPENAI_API_KEY.
                  </AlertDescription>
                </Alert>
              )}

              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="h-3 w-3 text-primary" />
                      </div>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Button onClick={generateAIInsights} disabled={isLoading}>
                  Gerar Insights com IA
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
