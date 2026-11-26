import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

export type PriceTextSize = 'sm' | 'md' | 'lg' | 'xl';
export type PriceTextWeight = 'medium' | 'bold' | 'black';

export interface PriceTextProps extends Omit<TextProps, 'children'> {
  /** Valor numérico del precio (ej. 25000) */
  price: number;
  /** Escala tipográfica predefinida */
  size?: PriceTextSize;
  /** Peso tipográfico */
  weight?: PriceTextWeight;
  /** Color personalizado (por defecto usa colors.amber) */
  color?: string;
}

/**
 * PriceText — Componente atómico para representación monetaria uniforme.
 *
 * Responsabilidad:
 *  - Formatear números utilizando formatCurrency() (es-AR).
 *  - Aplicar la escala y pesos definidos en el sistema de diseño.
 *  - Mantener la coherencia del color de acento para precios (colors.amber).
 */
export function PriceText({
  price,
  size = 'md',
  weight = 'bold',
  color = colors.amber,
  style,
  ...rest
}: PriceTextProps) {
  const formattedPrice = formatCurrency(price);

  return (
    <Text
      style={[
        styles.base,
        styles[size],
        styles[weight],
        { color },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Precio: ${formattedPrice}`}
      {...rest}
    >
      {formattedPrice}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Tamaños
  sm: {
    fontSize: 13,
    lineHeight: 18,
  },
  md: {
    fontSize: 15,
    lineHeight: 20,
  },
  lg: {
    fontSize: 20,
    lineHeight: 26,
  },
  xl: {
    fontSize: 24,
    lineHeight: 30,
  },
  // Pesos
  medium: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '800',
  },
  black: {
    fontWeight: '900',
  },
});
