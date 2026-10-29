import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
export default function ThemeToggle({ className = '' }) {
    const { theme, toggle } = useTheme();
    const next = theme === 'dark' ? 'light' : 'dark';
    return (<button type="button" onClick={toggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`} className={`theme-toggle ${className}`}>
      {theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}
    </button>);
}
