import { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import { AlertCircle } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render diagram when chart or theme changes
  useEffect(() => {
    if (!mounted) return;

    const renderDiagram = async () => {
      try {
        // Initialize Mermaid with current theme
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 16,
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            curve: 'basis',
          },
          themeVariables: {
            fontSize: '16px',
          },
        });

        // Generate unique ID for this diagram
        const id = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err as Error);
        setSvg('');
      }
    };

    renderDiagram();
  }, [chart, resolvedTheme, mounted]);

  // Loading state
  if (!mounted) {
    return (
      <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-4 my-4 animate-pulse h-48 border border-zinc-200 dark:border-zinc-700" />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 my-4 border border-red-200 dark:border-red-800 overflow-hidden">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">
              Invalid Mermaid Syntax
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 break-words">
              {error.message}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700 dark:text-red-300 hover:underline">
                Show diagram code
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-950 rounded text-xs overflow-x-auto font-mono break-all whitespace-pre-wrap">
                {chart}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render the diagram
  return (
    <div className="rounded-md bg-white dark:bg-zinc-900 p-4 my-4 border border-zinc-200 dark:border-zinc-800 overflow-x-auto transition-colors duration-300">
      <div
        className="mermaid-container"
        style={{ minHeight: '200px' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
