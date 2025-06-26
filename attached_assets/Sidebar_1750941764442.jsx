import { Sun, Moon, Plus, Settings, User, HelpCircle } from 'lucide-react'

export default function Sidebar({ darkMode, setDarkMode }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-100 dark:bg-gray-800 p-4">
      <button className="flex items-center gap-2 p-2 rounded-md bg-green-600 text-white mb-4">
        <Plus size={20}/> Nova Conversa
      </button>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <div className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">Conversa anterior</div>
      </div>
      <div className="flex flex-col gap-2">
        <button className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><User size={18}/> Perfil</button>
        <button className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><Settings size={18}/> Configurações</button>
        <button className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><HelpCircle size={18}/> Ajuda</button>
        <button className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun size={18}/> : <Moon size={18}/>} {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </aside>
  )
}
