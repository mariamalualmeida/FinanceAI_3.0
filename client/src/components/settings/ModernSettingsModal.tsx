import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Palette, Brain, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingSections = [
  { 
    id: "appearance", 
    label: "Aparência", 
    icon: Palette,
    description: "Customize o visual da interface para melhor experiência" 
  },
  { 
    id: "ai", 
    label: "IA", 
    icon: Brain,
    description: "Configure o provedor de IA e suas preferências" 
  },
  { 
    id: "security", 
    label: "Segurança", 
    icon: Shield,
    description: "Gerencie suas configurações de segurança e privacidade" 
  },
];

export function ModernSettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("appearance");

  const { data: settings = {} } = useQuery({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => apiRequest("/api/settings", "PATCH", newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      theme: settings.theme || "light",
      primaryColor: settings.primaryColor || "blue",
      fontSize: settings.fontSize || "medium",
    });
  };

  const activeConfig = settingSections.find(s => s.id === activeSection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[800px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                {activeConfig && <activeConfig.icon className="h-5 w-5 text-primary" />}
              </div>
              Configurações
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Mobile: Show only content, hide sidebar */}
          <div className="hidden md:flex w-80 bg-muted/30 border-r border-border">
            <div className="w-full p-4">
              <div className="space-y-2">
                {settingSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-colors",
                        "flex items-start gap-3",
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{section.label}</div>
                        <div className={cn(
                          "text-xs mt-1 line-clamp-2",
                          activeSection === section.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}>
                          {section.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile: Section selector at top */}
          <div className="md:hidden w-full border-b border-border p-4">
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settingSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Aparência</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Customize o visual da interface para melhor experiência em qualquer dispositivo
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="theme">Modo Escuro</Label>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm">Interface otimizada para ambientes com pouca luz</p>
                        </div>
                        <Switch 
                          id="theme"
                          checked={settings.theme === "dark"}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ theme: checked ? "dark" : "light" })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="primaryColor">Cor Principal</Label>
                      <Select 
                        value={settings.primaryColor || "blue"}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ primaryColor: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha a cor de destaque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Azul</SelectItem>
                          <SelectItem value="green">Verde</SelectItem>
                          <SelectItem value="purple">Roxo</SelectItem>
                          <SelectItem value="orange">Laranja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                      <Select 
                        value={settings.fontSize || "medium"}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ fontSize: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tamanho do texto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeno</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "ai" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Configurações de IA</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Configure o provedor de inteligência artificial e suas preferências de análise
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="aiProvider">Provedor de IA</Label>
                      <Select 
                        value={settings.llmProvider || "openai"}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ llmProvider: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha o provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                          <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                          <SelectItem value="gemini">Google (Gemini)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="apiKey">Chave da API</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Sua chave de API (opcional)"
                        value={settings.llmApiKey || ""}
                        onChange={(e) => 
                          updateSettingsMutation.mutate({ llmApiKey: e.target.value })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe em branco para usar a chave padrão do sistema
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Segurança e Privacidade</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Gerencie suas configurações de segurança e proteção de dados
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="anonymization">Anonimização de Dados</Label>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 mr-4">
                          <p className="text-sm">Remove informações pessoais dos documentos antes da análise</p>
                        </div>
                        <Switch 
                          id="anonymization"
                          checked={settings.anonymizationEnabled || false}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ anonymizationEnabled: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="twoFactor">Autenticação de Dois Fatores</Label>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 mr-4">
                          <p className="text-sm">Adiciona uma camada extra de segurança à sua conta</p>
                        </div>
                        <Switch 
                          id="twoFactor"
                          checked={settings.twoFactorEnabled || false}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ twoFactorEnabled: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}