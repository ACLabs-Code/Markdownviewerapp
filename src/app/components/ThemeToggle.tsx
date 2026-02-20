
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors relative"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="min-w-[150px] bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
          sideOffset={5}
        >
          <DropdownMenu.Item
            onClick={() => {
              setTheme('light');
              toast.success('Theme set to Light');
            }}
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 ${theme === 'light' ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : ''}`}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => {
              setTheme('dark');
              toast.success('Theme set to Dark');
            }}
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 ${theme === 'dark' ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : ''}`}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => {
              setTheme('system');
              toast.success('Theme set to System');
            }}
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 ${theme === 'system' ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : ''}`}
          >
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
