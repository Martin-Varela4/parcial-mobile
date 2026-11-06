/**
 * FavoriteProductCard — Tarjeta de presentación de producto favorito (ProductRow).
 *
 * Muestra la información del producto y permite la navegación al detalle.
 * Diseñada para anidarse dentro de SwipeRow (Gestos.pdf, Diapositiva 18).
 */

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '@/features/products/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

interface FavoriteProductCardProps {
  item: Product;
  onPress: () => void;
}

export function FavoriteProductCard({ item, onPress }: FavoriteProductCardProps) {
  const imageSource =
    typeof item.imagen === 'string' ? { uri: item.imagen } : item.imagen;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${item.nombre}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={styles.cardCategory}>{item.categoria}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(item.precio)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    height: 92,
  },
  imageContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  cardCategory: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.amber,
    marginTop: 4,
  },
});
