import { Menu } from 'lucide-react'

export default function MobileToggle({ toggleSidebar, isSidebarOpen }) {
  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-[#343541] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white md:hidden"
      aria-label="Toggle sidebar"
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <Menu size={20} />
    </button>
  )
}