import { mockProducts } from '../data/mockProducts';
import { Product } from '../types';

export const productsService = {
  /**
   * Obtiene la lista completa de productos.
   * Actualmente resuelve los datos de prueba locales.
   * En producción: return apiClient.get<Product[]>(ENDPOINTS.PRODUCTS);
   */
  async getProducts(): Promise<Product[]> {
    return Promise.resolve(mockProducts);
  },

  /**
   * Obtiene un producto por su identificador numérico.
   * En producción: return apiClient.get<Product>(ENDPOINTS.PRODUCT_DETAIL(id));
   */
  async getProductById(id: number): Promise<Product | undefined> {
    const product = mockProducts.find((item) => item.id === id);
    return Promise.resolve(product);
  },
};
