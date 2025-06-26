import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleTopBarProps {
  onMenuClick: () => void;
}

export function SimpleTopBar({ onMenuClick }: SimpleTopBarProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">FinanceAI</h1>
      </div>
      <div className="text-sm text-gray-400 hidden md:block">
        Assistente Financeiro Inteligente
      </div>
    </header>
  );
}