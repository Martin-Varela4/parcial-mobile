import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/services/storage/keys';

export const favoritesStorage = {
  /**
   * Obtiene la lista persistida de IDs de productos favoritos.
   * Si ocurre un error de lectura, lo registra y retorna un arreglo vacío seguro.
   */
  async getFavorites(): Promise<number[]> {
    try {
      console.log('[FavoritesStorage] Iniciando lectura con clave:', STORAGE_KEYS.FAVORITES);
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!raw) {
        console.log('[FavoritesStorage] No se encontraron favoritos previos en storage (clave vacía).');
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const uniqueIds = Array.from(
          new Set(
            parsed
              .map((id) => Number(id))
              .filter((id) => !isNaN(id) && Number.isInteger(id) && id >= 0)
          )
        );
        console.log('[FavoritesStorage] Lectura exitosa. IDs recuperados:', uniqueIds.length);
        return uniqueIds;
      }
      console.warn('[FavoritesStorage] Los datos recuperados no tienen formato de arreglo:', parsed);
      return [];
    } catch (error) {
      console.error('[FavoritesStorage] Error al leer favoritos de AsyncStorage:', error);
      return [];
    }
  },

  /**
   * Persiste la lista de IDs de productos favoritos en AsyncStorage.
   * Lanza el error si falla la escritura para no ocultar fallos de persistencia.
   */
  async saveFavorites(favorites: number[]): Promise<void> {
    try {
      const uniqueIds = Array.from(
        new Set(
          favorites
            .map((id) => Number(id))
            .filter((id) => !isNaN(id) && Number.isInteger(id) && id >= 0)
        )
      );
      console.log(
        '[FavoritesStorage] Guardando en clave:',
        STORAGE_KEYS.FAVORITES,
        '- Cantidad de IDs:',
        uniqueIds.length
      );
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(uniqueIds));
      console.log('[FavoritesStorage] Escritura finalizada con éxito en AsyncStorage.');
    } catch (error) {
      console.error('[FavoritesStorage] Error al guardar favoritos en AsyncStorage:', error);
      throw error;
    }
  },

  /**
   * Elimina la clave de favoritos del almacenamiento local.
   */
  async clearFavorites(): Promise<void> {
    try {
      console.log('[FavoritesStorage] Eliminando clave:', STORAGE_KEYS.FAVORITES);
      await AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES);
      console.log('[FavoritesStorage] Clave de favoritos eliminada con éxito.');
    } catch (error) {
      console.error('[FavoritesStorage] Error al eliminar favoritos de AsyncStorage:', error);
      throw error;
    }
  },
};
