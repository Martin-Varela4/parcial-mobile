import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  /** Espaciado interno predefinido o numérico en puntos */
  padding?: CardPadding | number;
  /** Radio de curvatura de esquinas */
  radius?: CardRadius | number;
  /** Color de fondo (por defecto colors.bgAlt) */
  backgroundColor?: string;
  /** Si incluye borde perimetral sutil (colors.line) */
  border?: boolean;
  /** Sombra sutil y elevación en Android */
  elevation?: boolean;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Callback opcional si la tarjeta es clickeable */
  onPress?: () => void;
  accessibilityRole?: 'button' | 'none';
  accessibilityLabel?: string;
}

/**
 * Card — Contenedor visual base reutilizable.
 *
 * Responsabilidad:
 *  - Estandarizar el fondo, borde y bordes redondeados de las tarjetas.
 *  - No imponer una distribución interna rígida (flexDirection, alineación interna, etc.).
 *  - Si recibe `onPress`, se comporta como un Pressable accesible.
 */
export function Card({
  children,
  padding = 'md',
  radius = 'md',
  backgroundColor = colors.bgAlt,
  border = true,
  elevation = false,
  style,
  onPress,
  accessibilityRole = onPress ? 'button' : 'none',
  accessibilityLabel,
}: CardProps) {
  const paddingStyle: ViewStyle =
    typeof padding === 'number'
      ? { padding }
      : styles[`padding_${padding}`];

  const radiusStyle: ViewStyle =
    typeof radius === 'number'
      ? { borderRadius: radius }
      : styles[`radius_${radius}`];

  const cardStyles: StyleProp<ViewStyle> = [
    styles.base,
    paddingStyle,
    radiusStyle,
    { backgroundColor },
    border && styles.border,
    elevation && styles.elevation,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [cardStyles, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  border: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  elevation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.88,
  },
  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
  // Radios
  radius_sm: {
    borderRadius: 10,
  },
  radius_md: {
    borderRadius: 14,
  },
  radius_lg: {
    borderRadius: 18,
  },
});
