import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-5 h-5" />;
      case 'dark': return <Moon className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Toggle Theme"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => { setTheme('light'); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                theme === 'light' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
              )}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>
            <button
              onClick={() => { setTheme('dark'); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                theme === 'dark' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
              )}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => { setTheme('system'); setIsOpen(false); }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                theme === 'system' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
              )}
            >
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
