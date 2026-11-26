import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/services/storage/keys';
import { CartItem } from '../types/cart.types';

export const cartStorage = {
  /**
   * Obtiene la lista persistida de elementos del carrito de compras.
   * Si ocurre un error de lectura o no hay datos, retorna un arreglo vacío seguro.
   */
  async getCart(): Promise<CartItem[]> {
    try {
      console.log('[CartStorage] Iniciando lectura con clave:', STORAGE_KEYS.CART);
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CART);
      if (!raw) {
        console.log('[CartStorage] No se encontraron elementos previos en storage (clave vacía).');
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn('[CartStorage] Los datos recuperados no tienen formato de arreglo:', parsed);
        return [];
      }

      // Validar y sanitizar cada elemento del carrito recuperado
      const validItems: CartItem[] = [];
      const seenProductIds = new Set<number>();

      for (const item of parsed) {
        if (
          item &&
          typeof item === 'object' &&
          item.product &&
          typeof item.product.id === 'number' &&
          typeof item.product.nombre === 'string' &&
          typeof item.product.precio === 'number' &&
          typeof item.quantity === 'number' &&
          item.quantity >= 1
        ) {
          const productId = item.product.id;
          if (!seenProductIds.has(productId)) {
            seenProductIds.add(productId);
            validItems.push({
              product: item.product,
              quantity: Math.floor(item.quantity),
            });
          } else {
            // Si por alguna razón hubiese duplicados en storage, consolidamos la cantidad
            const existing = validItems.find((i) => i.product.id === productId);
            if (existing) {
              existing.quantity += Math.floor(item.quantity);
            }
          }
        }
      }

      console.log('[CartStorage] Lectura exitosa. Ítems recuperados:', validItems.length);
      return validItems;
    } catch (error) {
      console.error('[CartStorage] Error al leer carrito de AsyncStorage:', error);
      return [];
    }
  },

  /**
   * Persiste la lista de elementos del carrito en AsyncStorage.
   * Lanza el error si falla la escritura para no ocultar fallos de persistencia.
   */
  async saveCart(cart: CartItem[]): Promise<void> {
    try {
      console.log('[CartStorage] Guardando en clave:', STORAGE_KEYS.CART, '- Cantidad de ítems:', cart.length);
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      console.log('[CartStorage] Escritura finalizada con éxito en AsyncStorage.');
    } catch (error) {
      console.error('[CartStorage] Error al guardar carrito en AsyncStorage:', error);
      throw error;
    }
  },

  /**
   * Elimina la clave del carrito del almacenamiento local.
   */
  async clearCart(): Promise<void> {
    try {
      console.log('[CartStorage] Eliminando clave:', STORAGE_KEYS.CART);
      await AsyncStorage.removeItem(STORAGE_KEYS.CART);
      console.log('[CartStorage] Clave del carrito eliminada con éxito.');
    } catch (error) {
      console.error('[CartStorage] Error al eliminar carrito de AsyncStorage:', error);
      throw error;
    }
  },
};
