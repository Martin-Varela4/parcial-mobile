import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { colors } from '@/theme/colors';

export type AppTextVariant =
  | 'screenTitle'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label';

export type AppTextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AppTextWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
export type AppTextAlign = 'auto' | 'left' | 'center' | 'right' | 'justify';

export interface AppTextProps extends TextProps {
  children: React.ReactNode;
  /** Variante semántica de texto */
  variant?: AppTextVariant;
  /** Sobrescribir tamaño tipográfico */
  size?: AppTextSize;
  /** Sobrescribir peso tipográfico */
  weight?: AppTextWeight;
  /** Sobrescribir color del texto */
  color?: string;
  /** Alineación del texto */
  align?: AppTextAlign;
}

/**
 * AppText — Componente atómico tipográfico centralizado.
 *
 * Responsabilidad:
 *  - Estandarizar la jerarquía visual de textos (títulos de pantalla, subtítulos, cuerpo, etiquetas).
 *  - Garantizar coherencia en el color de tinta (`colors.ink` para primarios, `colors.muted` para secundarios).
 */
export function AppText({
  children,
  variant = 'body',
  size,
  weight,
  color,
  align,
  style,
  ...rest
}: AppTextProps) {
  const dynamicStyles: TextStyle = {
    ...(color ? { color } : {}),
    ...(align ? { textAlign: align } : {}),
  };

  return (
    <Text
      style={[
        styles.base,
        styles[`variant_${variant}`],
        size && styles[`size_${size}`],
        weight && styles[`weight_${weight}`],
        dynamicStyles,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },

  // Variantes Semánticas
  variant_screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  variant_title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  variant_subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.muted,
    lineHeight: 20,
  },
  variant_body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.ink,
    lineHeight: 22,
  },
  variant_caption: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  variant_label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tamaños opcionales de sobrescritura
  size_xs: { fontSize: 11 },
  size_sm: { fontSize: 13 },
  size_md: { fontSize: 15 },
  size_lg: { fontSize: 18 },
  size_xl: { fontSize: 22 },
  size_xxl: { fontSize: 28 },

  // Pesos opcionales de sobrescritura
  weight_normal: { fontWeight: '400' },
  weight_medium: { fontWeight: '500' },
  weight_semibold: { fontWeight: '600' },
  weight_bold: { fontWeight: '700' },
  weight_black: { fontWeight: '900' },
});
