import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot, TrendingUp, Shield, BarChart3, Copy, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const { login, isLoginLoading } = useAuth();
  const { toast } = useToast();
  const { theme, toggleMode } = useTheme();
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await login({ username, password });
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao FinanceAI!",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro no login";
      setError(message);
    }
  };

  const copyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Credencial copiada para a área de transferência",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleMode}
        className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
      >
        {theme.mode === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <div className="w-full max-w-4xl grid lg:grid-cols-5 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="lg:col-span-3 space-y-8 text-center lg:text-left">
          <div className="space-y-6">
            <div className="flex items-center justify-center lg:justify-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FinanceAI
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Análise de Crédito Inteligente
                </p>
              </div>
            </div>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Transforme dados financeiros em insights poderosos com nossa plataforma de análise alimentada por IA.
            </p>
          </div>

          <div className="grid gap-4 max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Análise Completa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Processe extratos, faturas e contracheques automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Detecção de Riscos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Identifique apostas e movimentações suspeitas instantaneamente
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Relatórios Profissionais</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Gere análises detalhadas e scores de crédito precisos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="lg:col-span-2 w-full max-w-sm mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-6 space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Acesse sua conta
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Entre com suas credenciais para começar
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Credenciais Padrão
                  </Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Usuário:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">admin</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyCredentials("admin")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Senha:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">admin123</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyCredentials("admin123")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}