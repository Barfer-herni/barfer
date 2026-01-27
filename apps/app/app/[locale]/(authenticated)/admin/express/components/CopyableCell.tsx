'use client';

import { useCallback } from 'react';
import { toast } from '@repo/design-system/hooks/use-toast';
import { Copy } from 'lucide-react';

interface CopyableCellProps {
  /** Texto a copiar al portapapeles al hacer click */
  textToCopy: string;
  /** Contenido visible de la celda */
  children: React.ReactNode;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Si es false, no se muestra como clickeable ni se copia (ej. sin datos) */
  copyable?: boolean;
}

export function CopyableCell({
  textToCopy,
  children,
  className = '',
  copyable = true,
}: CopyableCellProps) {
  const copyToClipboard = useCallback(() => {
    if (!copyable || !textToCopy?.trim()) return;
    navigator.clipboard
      .writeText(textToCopy.trim())
      .then(() => {
        toast({ title: 'Copiado', description: 'Se copió al portapapeles' });
      })
      .catch(() => {
        toast({
          title: 'Error',
          description: 'No se pudo copiar',
          variant: 'destructive',
        });
      });
  }, [copyable, textToCopy]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      copyToClipboard();
    },
    [copyToClipboard]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard();
      }
    },
    [copyToClipboard]
  );

  if (!copyable || !textToCopy?.trim()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title="Click para copiar"
      className={`group flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors select-none ${className}`}
    >
      {children}
      <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden />
    </div>
  );
}
