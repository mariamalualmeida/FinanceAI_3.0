import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { settingsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Palette, Bot, Shield, User, Settings } from "lucide-react";
import { AdminPanel } from "./AdminPanel";
import { useAuth } from "@/hooks/useAuth";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Verifica se o usuário é Leonardo (administrador)
  const isAdmin = user?.username === "Leonardo";

  const [localSettings, setLocalSettings] = useState({
    llmProvider: "openai",
    llmApiKey: "",
    anonymizationEnabled: true,
    twoFactorEnabled: false,
  });

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (userSettings) {
      setLocalSettings({
        llmProvider: userSettings.llmProvider || "openai",
        llmApiKey: userSettings.llmApiKey || "",
        anonymizationEnabled: userSettings.anonymizationEnabled ?? true,
        twoFactorEnabled: userSettings.twoFactorEnabled ?? false,
      });
    }
  }, [userSettings]);

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const colorOptions = [
    { name: "Azul", value: "blue", color: "hsl(207, 90%, 54%)" },
    { name: "Verde", value: "green", color: "hsl(142, 71%, 45%)" },
    { name: "Roxo", value: "purple", color: "hsl(262, 83%, 58%)" },
    { name: "Vermelho", value: "red", color: "hsl(0, 84%, 60%)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Configurações</span>
          </DialogTitle>
          <DialogDescription>
            Personalize sua experiência no FinanceAI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>IA</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de IA</CardTitle>
                <CardDescription>
                  Configure o provedor de inteligência artificial e suas credenciais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider">Provedor de IA Principal</Label>
                  <Select
                    value={localSettings.llmProvider}
                    onValueChange={(value) =>
                      setLocalSettings(prev => ({ ...prev, llmProvider: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="anthropic">Claude 4 Sonnet</SelectItem>
                      <SelectItem value="gemini">Google Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">Chave da API</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={localSettings.llmApiKey}
                    onChange={(e) =>
                      setLocalSettings(prev => ({ ...prev, llmApiKey: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Sua chave de API será armazenada de forma segura e criptografada
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize o tema e as cores da interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tema Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar modo escuro para reduzir o cansaço visual
                    </p>
                  </div>
                  <Switch
                    checked={theme.mode === "dark"}
                    onCheckedChange={() => setTheme({ mode: theme.mode === "light" ? "dark" : "light" })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Cor Principal</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setTheme({ primaryColor: color.value })}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          theme.primaryColor === color.value
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.name}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Privacidade e Segurança</CardTitle>
                <CardDescription>
                  Configure as opções de segurança e privacidade dos seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Anonimização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove automaticamente dados sensíveis dos documentos processados
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.anonymizationEnabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings(prev => ({ ...prev, anonymizationEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dupla Autenticação</Label>
                    <p className="text-sm text-muted-foreground">
                      Adiciona uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setLocalSettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Proteção de Dados</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos os dados são processados de acordo com a LGPD e não são 
                        compartilhados com terceiros. As análises são realizadas localmente 
                        sempre que possível.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
