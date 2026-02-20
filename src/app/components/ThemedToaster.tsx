
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function ThemedToaster() {
  const { theme } = useTheme();

  // Ensure theme is one of the accepted values for Sonner, default to system if undefined
  const sonnerTheme =
    theme === 'dark' || theme === 'light' || theme === 'system' ? theme : 'system';

  return <Toaster position="top-right" theme={sonnerTheme} />;
}
