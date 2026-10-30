/**
 * SwipeableFavoriteCard
 *
 * Tarjeta de producto favorito con gesto de deslizamiento hacia la izquierda
 * para revelar una acción de eliminación.
 *
 * Dependencias:
 *   - react-native-gesture-handler 2.32
 *   - react-native-reanimated 4.5.1
 */

import { Product } from '@/features/products/types';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useImperativeHandle } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Ancho máximo que se revela al deslizar. */
const DELETE_ZONE_WIDTH = 80;

/** Umbral a partir del cual el gesto "confirma" la apertura (> 40 % de la zona). */
const OPEN_THRESHOLD = DELETE_ZONE_WIDTH * 0.45;

/** Configuración spring para movimientos fluidos. */
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.6 };

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SwipeableFavoriteCardHandle {
  /** Cierra la tarjeta si estaba abierta, sin animación brusca. */
  close: () => void;
}

interface SwipeableFavoriteCardProps {
  item: Product;
  onDelete: (id: number) => void;
  /** Se invoca cuando el gesto abre esta tarjeta para que el padre cierre las demás. */
  onOpen: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const SwipeableFavoriteCard = forwardRef<
  SwipeableFavoriteCardHandle,
  SwipeableFavoriteCardProps
>(({ item, onDelete, onOpen }, ref) => {
  const router = useRouter();

  /** Desplazamiento horizontal de la tarjeta (negativo = hacia la izquierda). */
  const translateX = useSharedValue(0);

  /** `true` mientras la tarjeta está en posición "abierta". */
  const isOpen = useSharedValue(false);

  // Expone `close()` al padre a través de la ref.
  useImperativeHandle(ref, () => ({
    close: () => {
      translateX.value = withSpring(0, SPRING_CONFIG);
      isOpen.value = false;
    },
  }));

  // ── Gesto de paneo ────────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    /**
     * El pan solo se activa cuando el movimiento horizontal supera 10 pt ANTES
     * de que el movimiento vertical supere 5 pt. Esto cede el control al
     * FlatList cuando el usuario intenta desplazarse verticalmente.
     */
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      'worklet';
      const base = isOpen.value ? -DELETE_ZONE_WIDTH : 0;
      const raw = base + event.translationX;
      // Limitar: máximo hacia la izquierda (-DELETE_ZONE_WIDTH), sin ir a la derecha.
      translateX.value = Math.min(0, Math.max(-DELETE_ZONE_WIDTH, raw));
    })
    .onEnd(() => {
      'worklet';
      const shouldOpen = translateX.value < -OPEN_THRESHOLD;
      if (shouldOpen) {
        translateX.value = withSpring(-DELETE_ZONE_WIDTH, SPRING_CONFIG);
        if (!isOpen.value) {
          isOpen.value = true;
          runOnJS(onOpen)();
        }
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        isOpen.value = false;
      }
    });

  // ── Estilos animados ──────────────────────────────────────────────────────

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  /** Opacidad y escala del botón de eliminar según cuánto se ha deslizado. */
  const deleteActionStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / DELETE_ZONE_WIDTH;
    return {
      opacity: interpolate(progress, [0, 0.5, 1], [0, 0.6, 1], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(progress, [0.5, 1], [0.7, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // ── Eliminar con animación de salida ─────────────────────────────────────

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  // ── Navegación al detalle ─────────────────────────────────────────────────

  const handlePress = useCallback(() => {
    if (isOpen.value) {
      // Si la tarjeta está abierta, cerrarla en lugar de navegar.
      translateX.value = withSpring(0, SPRING_CONFIG);
      isOpen.value = false;
      return;
    }
    router.push({
      pathname: '/producto/[id]',
      params: { id: String(item.id) },
    });
  }, [item.id, router, isOpen, translateX]);

  // ── Render ────────────────────────────────────────────────────────────────

  const imageSource =
    typeof item.imagen === 'string' ? { uri: item.imagen } : item.imagen;

  return (
    <View style={styles.container}>
      {/* Zona de acción — se revela detrás de la tarjeta al deslizar */}
      <Animated.View style={[styles.deleteZone, deleteActionStyle]}>
        <Pressable
          onPress={handleDelete}
          style={styles.deleteButton}
          accessibilityLabel={`Eliminar ${item.nombre} de favoritos`}
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteLabel}>Eliminar</Text>
        </Pressable>
      </Animated.View>

      {/* Tarjeta deslizable */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Pressable
            style={styles.pressableArea}
            onPress={handlePress}
            accessibilityLabel={`Ver detalle de ${item.nombre}`}
            accessibilityRole="button"
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

            {/* Botón de eliminación accesible siempre visible (ícono pequeño) */}
            <Pressable
              onPress={handleDelete}
              style={styles.inlineDeleteBtn}
              accessibilityLabel={`Eliminar ${item.nombre} de favoritos`}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="heart-dislike-outline" size={18} color={colors.muted} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

SwipeableFavoriteCard.displayName = 'SwipeableFavoriteCard';

export default SwipeableFavoriteCard;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  // ── Zona de eliminar ──────────────────────────────────────────────────────
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ZONE_WIDTH,
    backgroundColor: '#E53935',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // ── Tarjeta ───────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgAlt,
  },
  pressableArea: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  cardCategory: { fontSize: 12, color: colors.teal, fontWeight: '600' },
  cardPrice: { fontSize: 15, fontWeight: '800', color: colors.amber, marginTop: 4 },
  // ── Botón de eliminación inline ───────────────────────────────────────────
  inlineDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
