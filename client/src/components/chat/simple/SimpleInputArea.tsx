import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

interface SimpleInputAreaProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function SimpleInputArea({ onSend, disabled }: SimpleInputAreaProps) {
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
    <div className="flex items-center gap-2">
      <button className="p-2 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <Paperclip size={20} />
      </button>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Digite sua mensagem..."
        className="flex-1 resize-none bg-gray-300 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        disabled={disabled}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={20} />
      </button>
    </div>
  );
}