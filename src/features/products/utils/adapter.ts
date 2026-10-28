import { FakeStoreProduct, Product } from '../types';

/**
 * Adapta un producto de la respuesta de FakeStoreAPI al modelo interno de la aplicación.
 * Garantiza resiliencia frente a campos faltantes o tipos inesperados.
 */
export function adaptFakeStoreProduct(item: Partial<FakeStoreProduct> | null | undefined): Product {
  if (!item) {
    return {
      id: 0,
      nombre: 'Producto no disponible',
      precio: 0,
      categoria: 'General',
      imagen: require('@/assets/products/remera.jpg'),
      descripcion: 'Sin descripción',
    };
  }

  return {
    id: typeof item.id === 'number' ? item.id : Number(item.id) || 0,
    nombre: item.title?.trim() || 'Producto sin nombre',
    precio: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
    categoria: item.category?.trim() || 'General',
    imagen: item.image?.trim() || require('@/assets/products/remera.jpg'),
    descripcion: item.description?.trim() || 'Sin descripción disponible',
  };
}
