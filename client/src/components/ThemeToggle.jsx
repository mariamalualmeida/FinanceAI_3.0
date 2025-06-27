import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white"
      aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}