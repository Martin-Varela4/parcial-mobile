import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Product } from '@/features/products/types';
import { cartStorage } from '../services/cartStorage';
import { CartItem, CartContextType } from '../types/cart.types';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState<boolean>(false);

  // Mantiene la referencia inmediata del estado para evitar race conditions y desincronizaciones
  const cartRef = useRef<CartItem[]>([]);
  // Cola secuencial de promesas para garantizar persistencia ordenada en AsyncStorage
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Carga inicial del carrito desde AsyncStorage al montar el Provider
  useEffect(() => {
    let isMounted = true;

    console.log('[CartContext] Montando CartProvider. Iniciando carga inicial...');
    const loadPromise = cartStorage
      .getCart()
      .then((stored) => {
        if (isMounted) {
          cartRef.current = stored;
          setCart(stored);
          setIsCartLoaded(true);
          console.log('[CartContext] Carga inicial consolidada con', stored.length, 'ítems.');
        }
      })
      .catch((err) => {
        console.error('[CartContext] Error en carga inicial del carrito:', err);
        if (isMounted) {
          setIsCartLoaded(true);
        }
      });

    writeQueueRef.current = loadPromise;

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Agrega un producto al carrito.
   * Si no existe, lo agrega con cantidad 1.
   * Si ya existe, incrementa su cantidad en 1.
   */
  const addToCart = useCallback((product: Product): Promise<void> => {
    if (!product || typeof product.id !== 'number') {
      console.warn('[CartContext] Producto inválido recibido en addToCart:', product);
      return Promise.resolve();
    }

    console.log('[CartContext] addToCart invocado para producto ID:', product.id, product.nombre);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const current = cartRef.current;
        const existingIndex = current.findIndex((item) => item.product.id === product.id);

        let nextCart: CartItem[];

        if (existingIndex >= 0) {
          // El producto ya existe: incrementamos su cantidad
          nextCart = current.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          console.log(
            `[CartContext] Incrementando cantidad del producto ID ${product.id}. Nueva cantidad: ${nextCart[existingIndex].quantity}`
          );
        } else {
          // El producto no existe: agregamos nuevo ítem con cantidad 1
          nextCart = [...current, { product, quantity: 1 }];
          console.log(`[CartContext] Agregando nuevo producto ID ${product.id} con cantidad 1.`);
        }

        // Actualizamos la ref y el estado en memoria inmediatamente (optimistic UI)
        cartRef.current = nextCart;
        setCart(nextCart);

        // Persistimos en AsyncStorage
        await cartStorage.saveCart(nextCart);
      })
      .catch((error) => {
        console.error('[CartContext] Error al agregar producto al carrito:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Elimina por completo un producto del carrito según su ID.
   */
  const removeFromCart = useCallback((productId: number): Promise<void> => {
    console.log('[CartContext] removeFromCart invocado para ID:', productId);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const nextCart = cartRef.current.filter((item) => item.product.id !== productId);

        cartRef.current = nextCart;
        setCart(nextCart);

        await cartStorage.saveCart(nextCart);
      })
      .catch((error) => {
        console.error('[CartContext] Error al eliminar ítem del carrito:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Actualiza la cantidad de un producto.
   * Regla: La cantidad mínima es 1. No se permite bajar a 0.
   */
  const updateQuantity = useCallback((productId: number, quantity: number): Promise<void> => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    console.log('[CartContext] updateQuantity para ID:', productId, 'a:', safeQuantity);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const nextCart = cartRef.current.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: safeQuantity }
            : item
        );

        cartRef.current = nextCart;
        setCart(nextCart);

        await cartStorage.saveCart(nextCart);
      })
      .catch((error) => {
        console.error('[CartContext] Error al actualizar cantidad:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Incrementa la cantidad de un producto existente en 1.
   */
  const incrementQuantity = useCallback((productId: number): Promise<void> => {
    console.log('[CartContext] incrementQuantity para ID:', productId);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const nextCart = cartRef.current.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );

        cartRef.current = nextCart;
        setCart(nextCart);

        await cartStorage.saveCart(nextCart);
      })
      .catch((error) => {
        console.error('[CartContext] Error al incrementar cantidad:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Disminuye la cantidad de un producto existente en 1.
   * Regla: Si la cantidad actual es 1, no disminuye más (no queda en 0).
   */
  const decrementQuantity = useCallback((productId: number): Promise<void> => {
    console.log('[CartContext] decrementQuantity para ID:', productId);

    const taskPromise = writeQueueRef.current
      .then(async () => {
        const target = cartRef.current.find((item) => item.product.id === productId);
        if (!target || target.quantity <= 1) {
          console.log('[CartContext] Cantidad en el mínimo (1). No se decrementa.');
          return;
        }

        const nextCart = cartRef.current.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );

        cartRef.current = nextCart;
        setCart(nextCart);

        await cartStorage.saveCart(nextCart);
      })
      .catch((error) => {
        console.error('[CartContext] Error al decrementar cantidad:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Vacía por completo el carrito de compras y limpia AsyncStorage.
   */
  const clearCart = useCallback((): Promise<void> => {
    console.log('[CartContext] clearCart solicitado.');

    const taskPromise = writeQueueRef.current
      .then(async () => {
        cartRef.current = [];
        setCart([]);
        await cartStorage.clearCart();
      })
      .catch((error) => {
        console.error('[CartContext] Error al vaciar carrito:', error);
      });

    writeQueueRef.current = taskPromise;
    return taskPromise;
  }, []);

  /**
   * Determina si un producto ya se encuentra en el carrito.
   */
  const isInCart = useCallback((productId: number): boolean => {
    return cart.some((item) => item.product.id === productId);
  }, [cart]);

  /**
   * Obtiene la cantidad actual de un producto en el carrito (o 0 si no está).
   */
  const getItemQuantity = useCallback((productId: number): number => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  }, [cart]);

  // Cálculos numéricos reactivos garantizados sin depender de formato de texto
  const totalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    const rawTotal = cart.reduce((acc, item) => acc + item.product.precio * item.quantity, 0);
    return Math.round(rawTotal * 100) / 100;
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartLoaded,
        totalItems,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
}
