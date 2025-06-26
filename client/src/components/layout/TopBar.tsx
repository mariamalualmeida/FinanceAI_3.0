import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Moon, 
  Sun, 
  Bell, 
  Menu, 
  LogOut, 
  Settings, 
  User 
} from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggleMode } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-card border-b border-border px-3 py-2 flex items-center justify-between min-h-[56px] sticky top-0 z-30 backdrop-blur-sm bg-card/95">
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden shrink-0 h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground truncate sm:text-lg">
            <span className="hidden sm:inline">Análise Financeira Conversacional</span>
            <span className="sm:hidden">FinanceAI</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="h-9 w-9"
          title={theme.mode === 'light' ? 'Tema escuro' : 'Tema claro'}
        >
          {theme.mode === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* User Menu - Mobile optimized with avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <div className="h-7 w-7 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">
                  {user?.firstName?.[0] || user?.username?.[0] || "U"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mr-2">
            <div className="px-3 py-3 border-b border-border">
              <p className="font-medium text-foreground text-sm">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.email || "Consultor Financeiro"}
              </p>
            </div>
            <DropdownMenuItem className="py-3 focus:bg-muted">
              <User className="h-4 w-4 mr-3" />
              <span className="text-sm">Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 focus:bg-muted">
              <Settings className="h-4 w-4 mr-3" />
              <span className="text-sm">Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-600 py-3 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span className="text-sm">Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
