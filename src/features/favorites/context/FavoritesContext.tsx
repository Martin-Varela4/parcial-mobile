import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { favoritesStorage } from '../services/favoritesStorage';

export interface FavoritesContextType {
  favorites: number[];
  isFavoritesLoaded: boolean;
  toggleFavorite: (id: number) => Promise<void> | void;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isFavoritesLoaded, setIsFavoritesLoaded] = useState<boolean>(false);

  // Mantiene la referencia inmediata del estado para evitar race conditions y desincronizaciones
  const favoritesRef = useRef<number[]>([]);
  // Cola secuencial de promesas para garantizar persistencia ordenada
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Carga inicial de favoritos desde AsyncStorage
  useEffect(() => {
    let isMounted = true;

    console.log('[FavoritesContext] Montando FavoritesProvider. Iniciando carga inicial...');
    const loadPromise = favoritesStorage
      .getFavorites()
      .then((stored) => {
        if (isMounted) {
          favoritesRef.current = stored;
          setFavorites(stored);
          setIsFavoritesLoaded(true);
          console.log('[FavoritesContext] Carga inicial consolidada con', stored.length, 'IDs.');
        }
      })
      .catch((err) => {
        console.error('[FavoritesContext] Error en carga inicial de favoritos:', err);
        if (isMounted) {
          setIsFavoritesLoaded(true);
        }
      });

    writeQueueRef.current = loadPromise;

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFavorite = (id: number): Promise<void> => {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId < 0) {
      console.warn('[FavoritesContext] ID inválido recibido en toggleFavorite:', id);
      return Promise.resolve();
    }

    console.log('[FavoritesContext] toggleFavorite invocado para ID:', numericId);

    // Encolar secuencialmente después de cualquier operación previa (incluyendo carga inicial)
    const taskPromise = writeQueueRef.current
      .then(async () => {
        const current = favoritesRef.current;
        const exists = current.includes(numericId);
        const nextFavorites = exists
          ? current.filter((favId) => favId !== numericId)
          : [...current, numericId];

        console.log(
          `[FavoritesContext] ${exists ? 'Eliminando' : 'Agregando'} ID ${numericId}. Nuevo total: ${nextFavorites.length}`
        );

        // Actualizamos la ref inmediatamente para la siguiente operación encolada
        favoritesRef.current = nextFavorites;
        setFavorites(nextFavorites);

        // Persistimos en AsyncStorage
        await favoritesStorage.saveFavorites(nextFavorites);
      })
      .catch((error) => {
        console.error('[FavoritesContext] Error en ejecución de persistencia:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  };

  const isFavorite = (id: number) => {
    const numericId = Number(id);
    return favorites.includes(numericId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavoritesLoaded,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe ser utilizado dentro de un FavoritesProvider');
  }
  return context;
}
