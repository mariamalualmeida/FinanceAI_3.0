import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { settingsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AdminPanel } from "./AdminPanel";
import { 
  Palette, 
  Bot, 
  Shield, 
  User, 
  Settings,
  Moon,
  Sun,
  Zap,
  Lock,
  Eye,
  EyeOff,
  X
} from "lucide-react";

interface ModernSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModernSettingsModal({ open, onOpenChange }: ModernSettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeSection, setActiveSection] = useState("appearance");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Verifica se o usuário é Leonardo (administrador)
  const isAdmin = user?.username === "Leonardo";

  const [localSettings, setLocalSettings] = useState({
    llmProvider: "openai" as "openai" | "anthropic" | "gemini",
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
    },
    onError: () => {
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
        llmProvider: (userSettings.llmProvider as "openai" | "anthropic" | "gemini") || "openai",
        llmApiKey: userSettings.llmApiKey || "",
        anonymizationEnabled: userSettings.anonymizationEnabled ?? true,
        twoFactorEnabled: userSettings.twoFactorEnabled ?? false,
      });
    }
  }, [userSettings]);

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const sections = [
    { id: "appearance", name: "Aparência", icon: Palette },
    { id: "ai", name: "IA", icon: Bot },
    { id: "security", name: "Segurança", icon: Shield },
  ];

  const colorOptions = [
    { name: "Azul", value: "blue", color: "hsl(221, 83%, 53%)" },
    { name: "Verde", value: "green", color: "hsl(142, 76%, 36%)" },
    { name: "Roxo", value: "purple", color: "hsl(262, 83%, 58%)" },
    { name: "Rosa", value: "rose", color: "hsl(346, 77%, 49%)" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-3 text-xl">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <span>Configurações</span>
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex h-[calc(85vh-80px)]">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r bg-muted/20 p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Aparência</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Customize o visual da interface para sua preferência
                    </p>
                  </div>

                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {theme.mode === "dark" ? (
                          <Moon className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Sun className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <Label className="text-base font-medium">Modo Escuro</Label>
                          <p className="text-sm text-muted-foreground">
                            Interface otimizada para ambientes com pouca luz
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={theme.mode === "dark"}
                        onCheckedChange={() => setTheme({ mode: theme.mode === "light" ? "dark" : "light" })}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </Card>

                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-muted/20">
                    <div className="mb-4">
                      <Label className="text-base font-medium">Cor Principal</Label>
                      <p className="text-sm text-muted-foreground">
                        Escolha a cor de destaque da interface
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setTheme({ primaryColor: color.value })}
                          className={`relative aspect-square rounded-2xl border-2 transition-all overflow-hidden ${
                            theme.primaryColor === color.value
                              ? "border-foreground scale-110 shadow-lg"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.color }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                          {theme.primaryColor === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeSection === "ai" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Inteligência Artificial</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Configure o provedor de IA e personalize as análises
                    </p>
                  </div>

                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-muted/20">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Provedor de IA</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Selecione o modelo de IA para análises financeiras
                        </p>
                        <Select
                          value={localSettings.llmProvider}
                          onValueChange={(value: "openai" | "anthropic" | "gemini") =>
                            setLocalSettings(prev => ({ ...prev, llmProvider: value }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                            <SelectItem value="gemini">Google (Gemini)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base font-medium">Chave da API</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Sua chave pessoal para acessar o provedor de IA
                        </p>
                        <div className="relative">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            placeholder="sk-..."
                            value={localSettings.llmApiKey}
                            onChange={(e) =>
                              setLocalSettings(prev => ({ ...prev, llmApiKey: e.target.value }))
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Segurança e Privacidade</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Gerencie as configurações de segurança da sua conta
                    </p>
                  </div>

                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-muted/20">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-5 w-5 text-green-500" />
                          <div>
                            <Label className="text-base font-medium">Anonimização Automática</Label>
                            <p className="text-sm text-muted-foreground">
                              Remove automaticamente dados sensíveis dos documentos
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={localSettings.anonymizationEnabled}
                          onCheckedChange={(checked) =>
                            setLocalSettings(prev => ({ ...prev, anonymizationEnabled: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Lock className="h-5 w-5 text-blue-500" />
                          <div>
                            <Label className="text-base font-medium">Autenticação Dupla</Label>
                            <p className="text-sm text-muted-foreground">
                              Camada extra de segurança para sua conta
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={localSettings.twoFactorEnabled}
                          onCheckedChange={(checked) =>
                            setLocalSettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Painel Administrativo - Restrito ao Leonardo */}
                  {isAdmin && (
                    <Card className="p-6 border border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <div>
                            <Label className="text-base font-medium text-red-800 dark:text-red-200">
                              Painel Administrativo
                            </Label>
                            <p className="text-sm text-red-600 dark:text-red-300">
                              Acesso restrito para configurações avançadas do sistema
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowAdminPanel(true)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Acessar
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-muted/20">
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

      {/* Painel Administrativo - Overlay separado */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </>
  );
}