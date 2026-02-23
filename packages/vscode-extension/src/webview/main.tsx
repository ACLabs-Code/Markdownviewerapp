import { createRoot } from 'react-dom/client';
import { App } from './App';
// CSS is injected via <link> tag in the HTML template — do not import here.

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(<App />);
