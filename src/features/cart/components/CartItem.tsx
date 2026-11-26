import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types/cart.types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

interface CartItemProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onPressProduct?: () => void;
}

export function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onPressProduct,
}: CartItemProps) {
  const { product, quantity } = item;
  const imageSource =
    typeof product.imagen === 'string' ? { uri: product.imagen } : product.imagen;

  // Cálculo numérico estricto del subtotal
  const subtotal = product.precio * quantity;

  return (
    <View style={styles.card}>
      {/* Contenedor principal: Imagen + Info de producto */}
      <View style={styles.topRow}>
        <Pressable
          style={styles.imageContainer}
          onPress={onPressProduct}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalle de ${product.nombre}`}
        >
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.infoContainer}>
          <Pressable onPress={onPressProduct}>
            <Text style={styles.category}>{product.categoria}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {product.nombre}
            </Text>
          </Pressable>

          <View style={styles.priceRow}>
            <Text style={styles.unitPriceLabel}>Unitario:</Text>
            <Text style={styles.unitPrice}>{formatCurrency(product.precio)}</Text>
          </View>
        </View>

        {/* Botón para eliminar producto */}
        <Pressable
          style={styles.deleteButton}
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${product.nombre} del carrito`}
        >
          <Ionicons name="trash-outline" size={20} color="#E53935" />
        </Pressable>
      </View>

      {/* Línea divisoria interna */}
      <View style={styles.divider} />

      {/* Fila inferior: Selector de cantidad + Subtotal */}
      <View style={styles.bottomRow}>
        <View style={styles.quantityControl}>
          <Pressable
            style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
            onPress={onDecrement}
            disabled={quantity <= 1}
            accessibilityRole="button"
            accessibilityLabel="Disminuir cantidad"
            hitSlop={6}
          >
            <Ionicons
              name="remove"
              size={18}
              color={quantity <= 1 ? colors.line : colors.ink}
            />
          </Pressable>

          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{quantity}</Text>
          </View>

          <Pressable
            style={styles.qtyButton}
            onPress={onIncrement}
            accessibilityRole="button"
            accessibilityLabel="Aumentar cantidad"
            hitSlop={6}
          >
            <Ionicons name="add" size={18} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  imageContainer: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    gap: 3,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  unitPriceLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  unitPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyDisplay: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  subtotalContainer: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.amber,
  },
});
