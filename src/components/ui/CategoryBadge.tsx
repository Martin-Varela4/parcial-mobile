import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

export type CategoryBadgeVariant = 'pill' | 'subtle' | 'text';
export type CategoryBadgeSize = 'sm' | 'md';

export interface CategoryBadgeProps {
  /** Nombre o etiqueta de la categoría */
  category: string;
  /** Variante visual de presentación */
  variant?: CategoryBadgeVariant;
  /** Escala dimensional del badge */
  size?: CategoryBadgeSize;
  /** Forzar texto en mayúsculas (por defecto true) */
  uppercase?: boolean;
  /** Estilo para el contenedor externo */
  style?: StyleProp<ViewStyle>;
  /** Estilo para el texto interno */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * CategoryBadge — Componente atómico para etiquetas y categorías de producto.
 *
 * Responsabilidad:
 *  - Presentar la taxonomía o categoría con identidad visual unificada.
 *  - Soportar variantes: 'pill' (fondo sólido teal), 'subtle' (fondo suave traslúcido) o 'text' (solo texto estilizado).
 */
export function CategoryBadge({
  category,
  variant = 'pill',
  size = 'sm',
  uppercase = false,
  style,
  textStyle,
}: CategoryBadgeProps) {
  const displayText = uppercase ? category.toUpperCase() : category;

  return (
    <View
      style={[
        styles.baseContainer,
        styles[`container_${variant}`],
        styles[`container_${size}`],
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Categoría: ${category}`}
    >
      <Text
        style={[
          styles.baseText,
          styles[`text_${variant}`],
          styles[`text_${size}`],
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Contenedores por variante
  container_pill: {
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  container_subtle: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    borderRadius: 12,
  },
  container_text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // Contenedores por tamaño
  container_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  container_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  // Textos por variante
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text_pill: {
    color: colors.bg,
  },
  text_subtle: {
    color: colors.teal,
  },
  text_text: {
    color: colors.teal,
  },
  // Textos por tamaño
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 12,
  },
});
