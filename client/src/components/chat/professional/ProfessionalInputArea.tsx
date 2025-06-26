import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

interface ProfessionalInputAreaProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

function ProfessionalInputArea({ onSend, disabled }: ProfessionalInputAreaProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-4">
      <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
        <Paperclip className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="w-full resize-none bg-gray-600 border-gray-500 text-white placeholder-gray-300 rounded-3xl px-5 py-3 min-h-[50px] max-h-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
          rows={1}
          disabled={disabled}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="bg-blue-500 hover:bg-blue-400 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ProfessionalInputArea;