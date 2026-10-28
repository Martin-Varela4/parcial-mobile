import { useState, useEffect, useCallback } from 'react';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook reutilizable para peticiones HTTP con control de ciclo de vida,
 * cancelación mediante AbortController y prevención de fugas de memoria o condiciones de carrera.
 * Totalmente compatible con las reglas de React 19 y React Compiler.
 */
export function useFetch<T = any>(url: string | null): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Si la URL cambia entre renders, actualizamos el estado durante la fase de render (patrón recomendado React 19)
  const [prevUrl, setPrevUrl] = useState<string | null>(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    setLoading(Boolean(url));
    setError(null);
  }

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Error en el servidor: ${response.status} ${response.statusText}`.trim()
          );
        }
        try {
          return await response.json();
        } catch {
          throw new Error('La respuesta recibida no es un formato JSON válido.');
        }
      })
      .then((json: T) => {
        if (isMounted) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        // Si fue abortado intencionalmente, ignorar
        if (err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error de conexión. Comprobá tu acceso a internet.'
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, reloadKey]);

  return { data, loading, error, refetch };
}
