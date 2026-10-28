import { mockProducts } from '../data/mockProducts';
import { FakeStoreProduct, Product } from '../types';
import { adaptFakeStoreProduct } from '../utils/adapter';

const FAKESTORE_BASE_URL = 'https://fakestoreapi.com';

export const productsService = {
  /**
   * Obtiene la lista de productos desde FakeStoreAPI con fallback a mockProducts.
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${FAKESTORE_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data: FakeStoreProduct[] = await response.json();
      return data.map(adaptFakeStoreProduct);
    } catch {
      // Fallback a los datos locales en caso de falla de conexión
      return mockProducts;
    }
  },

  /**
   * Obtiene un producto por su identificador numérico.
   * Consulta FakeStoreAPI y, si no existe o falla, busca en los datos mock.
   */
  async getProductById(id: number): Promise<Product | undefined> {
    try {
      const response = await fetch(`${FAKESTORE_BASE_URL}/products/${id}`);
      if (response.ok) {
        const data: FakeStoreProduct = await response.json();
        return adaptFakeStoreProduct(data);
      }
    } catch {
      // Continuar al fallback local
    }

    // Fallback a datos locales
    return mockProducts.find((item) => item.id === id);
  },
};
