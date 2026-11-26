import { Product } from '@/features/products/types';

/**
 * Representa un elemento dentro del carrito de compras.
 * Contiene el producto referenciado y la cantidad seleccionada.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Contrato de operaciones y datos expuestos por CartContext.
 */
export interface CartContextType {
  cart: CartItem[];
  isCartLoaded: boolean;
  totalItems: number;
  totalAmount: number;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  incrementQuantity: (productId: number) => Promise<void>;
  decrementQuantity: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: number) => boolean;
  getItemQuantity: (productId: number) => number;
}
