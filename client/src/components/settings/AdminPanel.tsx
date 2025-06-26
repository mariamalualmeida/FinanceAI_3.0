import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, MessageSquare, Settings } from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    gemini: ""
  });
  const [prompts, setPrompts] = useState({
    system: "",
    financial: "",
    analysis: ""
  });

  const handleSaveApiKeys = () => {
    // TODO: Implementar salvamento das chaves API
    toast({
      title: "Chaves API salvas",
      description: "As configurações foram atualizadas com sucesso",
    });
  };

  const handleSavePrompts = () => {
    // TODO: Implementar salvamento dos prompts
    toast({
      title: "Prompts salvos",
      description: "As configurações dos prompts foram atualizadas",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l shadow-lg overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold">Painel Administrativo</h2>
              <p className="text-sm text-muted-foreground">Acesso restrito - Leonardo</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api-keys" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Prompts</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Sistema</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de API</CardTitle>
                  <CardDescription>
                    Configure as chaves de API para os provedores de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                      placeholder="sk-ant-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                      placeholder="AIza..."
                    />
                  </div>
                  <Button onClick={handleSaveApiKeys} className="w-full">
                    Salvar Chaves API
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Prompts</CardTitle>
                  <CardDescription>
                    Configure os prompts do sistema para diferentes funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">Prompt do Sistema</Label>
                    <Textarea
                      id="system-prompt"
                      value={prompts.system}
                      onChange={(e) => setPrompts(prev => ({ ...prev, system: e.target.value }))}
                      placeholder="Você é um assistente especializado em análise financeira..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financial-prompt">Prompt de Análise Financeira</Label>
                    <Textarea
                      id="financial-prompt"
                      value={prompts.financial}
                      onChange={(e) => setPrompts(prev => ({ ...prev, financial: e.target.value }))}
                      placeholder="Analise os seguintes dados financeiros..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="analysis-prompt">Prompt de Relatório</Label>
                    <Textarea
                      id="analysis-prompt"
                      value={prompts.analysis}
                      onChange={(e) => setPrompts(prev => ({ ...prev, analysis: e.target.value }))}
                      placeholder="Gere um relatório detalhado baseado na análise..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSavePrompts} className="w-full">
                    Salvar Prompts
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>
                    Configurações avançadas e logs do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Status do Sistema</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Versão:</span>
                        <span className="ml-2">1.0.0</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="ml-2">24h 15m</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Usuários:</span>
                        <span className="ml-2">2 ativos</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Análises:</span>
                        <span className="ml-2">156 processadas</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Exportar Logs do Sistema
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Limpar Cache do Sistema
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}