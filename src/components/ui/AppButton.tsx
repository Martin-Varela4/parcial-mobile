import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  /** Texto del botón */
  title: string;
  /** Acción a ejecutar al presionar */
  onPress: () => void | Promise<void>;
  /** Variante visual de color y énfasis */
  variant?: AppButtonVariant;
  /** Tamaño del botón (afecta padding y tamaño de fuente) */
  size?: AppButtonSize;
  /** Estado deshabilitado */
  disabled?: boolean;
  /** Estado de carga con indicador nativo */
  loading?: boolean;
  /** Ícono opcional posicionado antes del texto */
  icon?: React.ReactNode;
  /** Si debe ocupar el 100% del ancho del contenedor */
  fullWidth?: boolean;
  /** Estilos personalizados para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Estilos personalizados para el texto */
  textStyle?: StyleProp<TextStyle>;
  /** Etiqueta de accesibilidad (por defecto usa el título) */
  accessibilityLabel?: string;
}

/**
 * AppButton — Botón interactivo centralizado del sistema de diseño.
 *
 * Responsabilidad:
 *  - Estandarizar estados visuales (normal, presionado, deshabilitado, cargando).
 *  - Proveer variantes coherentes con la paleta de la aplicación.
 *  - Mantener feedback táctil accesible y uniforme.
 */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: AppButtonProps) {
  const isInteractive = !disabled && !loading;

  const spinnerColor =
    variant === 'primary' ? colors.bg : variant === 'danger' ? '#FFFFFF' : colors.teal;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.base,
        styles[`container_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.baseText,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },

  // Variantes de Contenedor
  container_primary: {
    backgroundColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  container_secondary: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  container_ghost: {
    backgroundColor: 'transparent',
  },
  container_danger: {
    backgroundColor: '#E53935',
  },

  // Tamaños de Contenedor
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  size_lg: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  // Texto base
  baseText: {
    fontWeight: '800',
    textAlign: 'center',
  },

  // Colores de texto por variante
  text_primary: {
    color: colors.bg,
  },
  text_secondary: {
    color: colors.ink,
  },
  text_outline: {
    color: colors.ink,
  },
  text_ghost: {
    color: colors.muted,
  },
  text_danger: {
    color: '#FFFFFF',
  },

  // Tamaños de texto
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 15,
  },
});
