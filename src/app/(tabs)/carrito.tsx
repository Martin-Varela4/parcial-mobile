import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/features/cart/context/CartContext';
import { CartItem } from '@/features/cart/components/CartItem';
import { CartSummary } from '@/features/cart/components/CartSummary';
import { EmptyCart } from '@/features/cart/components/EmptyCart';
import { CartItem as CartItemType } from '@/features/cart/types/cart.types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

export default function CarritoScreen() {
  const router = useRouter();
  const {
    cart,
    isCartLoaded,
    totalItems,
    totalAmount,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Confirmación antes de eliminar un producto individual
  const handleRemove = useCallback(
    (item: CartItemType) => {
      Alert.alert(
        'Eliminar producto',
        `¿Querés quitar "${item.product.nombre}" del carrito?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              removeFromCart(item.product.id);
            },
          },
        ]
      );
    },
    [removeFromCart]
  );

  // Confirmación antes de vaciar todo el carrito
  const handleClearCart = useCallback(() => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que querés eliminar todos los productos del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => {
            clearCart();
          },
        },
      ]
    );
  }, [clearCart]);

  // Simulación de finalización de compra
  const handleCheckout = useCallback(() => {
    Alert.alert(
      '¡Compra confirmada!',
      `Se procesó tu pedido por un total de ${formatCurrency(totalAmount)}.\n\n¡Muchas gracias por tu compra!`,
      [
        {
          text: 'Aceptar',
          onPress: () => {
            clearCart();
            router.push('/(tabs)');
          },
        },
      ]
    );
  }, [totalAmount, clearCart, router]);

  // Navegar al detalle de un producto al tocarlo
  const handlePressProduct = useCallback(
    (productId: number) => {
      router.push({
        pathname: '/producto/[id]',
        params: { id: String(productId) },
      });
    },
    [router]
  );

  const renderCartItem = useCallback(
    ({ item }: { item: CartItemType }) => (
      <CartItem
        item={item}
        onIncrement={() => incrementQuantity(item.product.id)}
        onDecrement={() => decrementQuantity(item.product.id)}
        onRemove={() => handleRemove(item)}
        onPressProduct={() => handlePressProduct(item.product.id)}
      />
    ),
    [incrementQuantity, decrementQuantity, handleRemove, handlePressProduct]
  );

  const keyExtractor = useCallback(
    (item: CartItemType) => String(item.product.id),
    []
  );

  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mi Carrito</Text>

      {/* CASO 1: Carga inicial de AsyncStorage */}
      {!isCartLoaded ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingSubtitle}>Cargando carrito de compras...</Text>
        </View>
      ) : cart.length === 0 ? (
        /* CASO 2: Carrito vacío */
        <EmptyCart />
      ) : (
        /* CASO 3: Listado de productos y resumen */
        <FlatList
          data={cart}
          keyExtractor={keyExtractor}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <CartSummary
              totalItems={totalItems}
              totalAmount={totalAmount}
              onCheckout={handleCheckout}
              onClear={handleClearCart}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  titleScreen: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  centerContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
});
