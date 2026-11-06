/**
 * Favoritos — pantalla principal de productos favoritos.
 *
 * Interacciones coordinadas:
 *  1. Toque normal      → navegar al detalle del producto.
 *  2. Deslizar ←        → revelar acción de eliminar (swipe-to-delete).
 *  3. Mantener presionado (400ms) + arrastrar ↕ → Drag & Drop con reordenamiento
 *     reactivo a 60 FPS en UI Thread, desplazamiento de tarjetas vecinas con resorte,
 *     aterrizaje suave en el slot destino y autoscroll perimetral.
 *  4. Scroll vertical normal → se desplaza la lista libremente.
 *
 * Arquitectura:
 *  - Paso de ranura uniforme (PITCH = 104 pt: 92 pt de tarjeta + 12 pt de gap).
 *  - SharedValues de Reanimated centralizados en UI thread.
 *  - Sin lectura de SharedValues durante render (cero advertencias de Reanimated).
 *  - Sincronización de lista local inmune a carreras de reordenamiento.
 *  - Persistencia en FavoritesContext + AsyncStorage tras finalizar la animación de resorte.
 *  - 100% compatible con Expo Go.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  scrollTo,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import SwipeableFavoriteCard, {
  SwipeableFavoriteCardHandle,
} from '@/features/favorites/components/SwipeableFavoriteCard';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct, Product } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';

// ─── Constantes geométricas y de animación ─────────────────────────────────────

/** Altura fija de cada tarjeta en puntos. */
const CARD_HEIGHT = 92;

/** Separación entre tarjetas en la lista. */
const CARD_GAP = 12;

/** Paso total por elemento (slot pitch). */
const ITEM_PITCH = CARD_HEIGHT + CARD_GAP; // 104 pt

/** Duración mínima de pulsación prolongada para activar el arrastre. */
const LONG_PRESS_DURATION = 400; // ms

/** Zona perimetral superior/inferior para activar el autoscroll (en px). */
const SCROLL_EDGE_ZONE = 80;

/** Velocidad máxima de autoscroll en píxeles por frame. */
const MAX_AUTOSCROLL_SPEED = 14;

/** Configuración de resorte para el desplazamiento de tarjetas vecinas. */
const SPRING_NEIGHBOR_CONFIG = { damping: 20, stiffness: 220, mass: 0.6 };

/** Configuración de resorte para el aterrizaje de la tarjeta en la ranura. */
const SPRING_DROP_CONFIG = { damping: 24, stiffness: 240, mass: 0.8 };

// ─── Fila arrastrable (DraggableRow) ───────────────────────────────────────────

interface DraggableRowProps {
  item: Product;
  index: number;
  activeId: SharedValue<number>;
  activeIndex: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  translationY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  isTouchDown: SharedValue<boolean>;
  autoscrollSpeed: SharedValue<number>;
  scrollViewScreenY: SharedValue<number>;
  scrollViewHeight: SharedValue<number>;
  totalCountShared: SharedValue<number>;
  onDragStart: (id: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  onDragCancel: () => void;
  onDelete: (id: number) => void;
  onOpen: (id: number) => void;
  cardRef: (handle: SwipeableFavoriteCardHandle | null) => void;
  isThisCardDragging: boolean;
  isAnyDragging: boolean;
}

const DraggableRow = React.memo(function DraggableRow({
  item,
  index,
  activeId,
  activeIndex,
  hoverIndex,
  translationY,
  isDragging,
  isTouchDown,
  autoscrollSpeed,
  scrollViewScreenY,
  scrollViewHeight,
  totalCountShared,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onDelete,
  onOpen,
  cardRef,
  isThisCardDragging,
  isAnyDragging,
}: DraggableRowProps) {
  // ── Estilo animado continuo en UI Thread ──────────────────────────────────
  const animatedRowStyle = useAnimatedStyle(() => {
    const isThisActive = activeId.value === item.id;

    // Caso 1: Esta tarjeta es la que está siendo arrastrada o aterrizando en slot
    if (isThisActive) {
      return {
        transform: [
          { translateY: translationY.value },
          { scale: withSpring(isTouchDown.value ? 1.03 : 1, { damping: 18 }) },
        ],
        zIndex: 999,
        elevation: 10,
        shadowOpacity: 0.3,
        shadowRadius: 10,
      };
    }

    // Caso 2: Ninguna tarjeta está en arrastre (en reposo)
    // Se utiliza withTiming(0, { duration: 0 }) para forzar a 0 de forma atómica e instantánea
    // cualquier resorte residual previo sobre la vista nativa al consolidar el orden, erradicando
    // cualquier intercambio visual transitorio.
    if (!isDragging.value || activeIndex.value === -1 || hoverIndex.value === -1) {
      return {
        transform: [{ translateY: withTiming(0, { duration: 0 }) }, { scale: 1 }],
        zIndex: 1,
        elevation: 2,
        shadowOpacity: 0.08,
        shadowRadius: 4,
      };
    }

    // Caso 3: Otra tarjeta se está arrastrando. Desplazamos esta vecina si corresponde
    const from = activeIndex.value;
    const to = hoverIndex.value;
    let targetOffset = 0;

    if (from < to) {
      // Arrastre hacia ABAJO: los elementos entre from + 1 y to suben 1 ranura (-ITEM_PITCH)
      if (index > from && index <= to) {
        targetOffset = -ITEM_PITCH;
      }
    } else if (from > to) {
      // Arrastre hacia ARRIBA: los elementos entre to y from - 1 bajan 1 ranura (+ITEM_PITCH)
      if (index >= to && index < from) {
        targetOffset = ITEM_PITCH;
      }
    }

    return {
      transform: [
        { translateY: withSpring(targetOffset, SPRING_NEIGHBOR_CONFIG) },
        { scale: 1 },
      ],
      zIndex: 1,
      elevation: 2,
      shadowOpacity: 0.08,
      shadowRadius: 4,
    };
  });

  // ── Gesto de Pan con activación tras LongPress (400ms) ────────────────────
  // failOffsetX([-15, 15]): si el usuario desliza horizontalmente rápido,
  // el gesto de arrastre falla de inmediato cediendo el control al swipe de eliminación.
  const dragPan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_DURATION)
    .failOffsetX([-15, 15])
    .onStart(() => {
      'worklet';
      activeId.value = item.id;
      activeIndex.value = index;
      hoverIndex.value = index;
      translationY.value = 0;
      isDragging.value = true;
      isTouchDown.value = true;
      runOnJS(onDragStart)(item.id);
    })
    .onUpdate((e) => {
      'worklet';
      if (!isDragging.value || activeId.value !== item.id) return;

      translationY.value = e.translationY;

      // Posición física del centro de la tarjeta en coordenadas de contenido
      const currentContentY = index * ITEM_PITCH + e.translationY;
      const targetSlot = Math.floor((currentContentY + ITEM_PITCH / 2) / ITEM_PITCH);
      const clampedSlot = Math.max(0, Math.min(totalCountShared.value - 1, targetSlot));
      if (hoverIndex.value !== clampedSlot) {
        hoverIndex.value = clampedSlot;
      }

      // Detección perimetral para autoscroll
      const relativeToScrollView = e.absoluteY - scrollViewScreenY.value;
      if (relativeToScrollView < SCROLL_EDGE_ZONE) {
        const factor = (SCROLL_EDGE_ZONE - relativeToScrollView) / SCROLL_EDGE_ZONE;
        autoscrollSpeed.value = -Math.max(3, factor * MAX_AUTOSCROLL_SPEED);
      } else if (relativeToScrollView > scrollViewHeight.value - SCROLL_EDGE_ZONE) {
        const factor =
          (relativeToScrollView - (scrollViewHeight.value - SCROLL_EDGE_ZONE)) / SCROLL_EDGE_ZONE;
        autoscrollSpeed.value = Math.max(3, factor * MAX_AUTOSCROLL_SPEED);
      } else {
        autoscrollSpeed.value = 0;
      }
    })
    .onEnd(() => {
      'worklet';
      if (!isDragging.value || activeId.value !== item.id) return;
      autoscrollSpeed.value = 0;
      isTouchDown.value = false;

      const fromIdx = activeIndex.value;
      const toIdx = hoverIndex.value;

      if (fromIdx === toIdx) {
        // Soltado en la misma posición original: regresar con spring y limpiar
        translationY.value = withSpring(0, SPRING_DROP_CONFIG, () => {
          'worklet';
          isDragging.value = false;
          activeId.value = -1;
          activeIndex.value = -1;
          hoverIndex.value = -1;
          translationY.value = 0;
          runOnJS(onDragCancel)();
        });
        return;
      }

      // Animación suave de aterrizaje en la ranura destino
      const targetLandingOffset = (toIdx - fromIdx) * ITEM_PITCH;

      translationY.value = withSpring(
        targetLandingOffset,
        SPRING_DROP_CONFIG,
        (isFinished) => {
          'worklet';
          if (isFinished) {
            // Notificar a JS para que reordene la lista en React.
            // Los SharedValues se mantienen en sus posiciones finales (targetLandingOffset y ±ITEM_PITCH)
            // hasta que useLayoutEffect en React monte el nuevo orden y los resetee atómicamente a 0.
            runOnJS(onDragEnd)(fromIdx, toIdx);
          } else {
            isDragging.value = false;
            activeId.value = -1;
            activeIndex.value = -1;
            hoverIndex.value = -1;
            translationY.value = 0;
            runOnJS(onDragCancel)();
          }
        }
      );
    })
    .onFinalize((_event, success) => {
      'worklet';
      autoscrollSpeed.value = 0;
      // Solo restaurar si el gesto falló o fue cancelado antes de completarse onEnd
      if (!success && activeId.value === item.id) {
        isTouchDown.value = false;
        hoverIndex.value = activeIndex.value;
        translationY.value = withSpring(0, SPRING_DROP_CONFIG, () => {
          'worklet';
          isDragging.value = false;
          activeId.value = -1;
          activeIndex.value = -1;
          hoverIndex.value = -1;
          translationY.value = 0;
        });
        runOnJS(onDragCancel)();
      }
    });

  return (
    <GestureDetector gesture={dragPan}>
      <Animated.View style={[styles.itemWrapper, animatedRowStyle]}>
        <SwipeableFavoriteCard
          ref={cardRef}
          item={item}
          onDelete={onDelete}
          onOpen={() => onOpen(item.id)}
          isDragging={isThisCardDragging}
          disabled={isAnyDragging}
        />
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Favoritos() {
  const { favorites, isFavoritesLoaded, toggleFavorite, reorderFavorites } = useFavorites();

  const cardRefs = useRef<Map<number, SwipeableFavoriteCardHandle>>(new Map());
  const openCardId = useRef<number | null>(null);

  // ── Productos remotos ──────────────────────────────────────────────────────
  const {
    data: rawProducts,
    loading: loadingApi,
    error: errorApi,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  const allAvailableProducts = useMemo(() => {
    if (Array.isArray(rawProducts)) {
      return rawProducts.map(adaptFakeStoreProduct);
    }
    // Fallback a mockProducts solo en caso de falla de conexión real
    if (errorApi) {
      return mockProducts;
    }
    return [];
  }, [rawProducts, errorApi]);

  // Lista canónica de productos favoritos en el orden persistido en favorites[]
  const favoriteProducts = useMemo(
    () =>
      favorites
        .map((id) => allAvailableProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
    [allAvailableProducts, favorites]
  );

  // ── SharedValues centrales de Reanimated en UI Thread ─────────────────────
  const activeId = useSharedValue<number>(-1);
  const activeIndex = useSharedValue<number>(-1);
  const hoverIndex = useSharedValue<number>(-1);
  const translationY = useSharedValue<number>(0);
  const isDragging = useSharedValue<boolean>(false);
  const isTouchDown = useSharedValue<boolean>(false);
  const autoscrollSpeed = useSharedValue<number>(0);
  const scrollY = useSharedValue<number>(0);
  const scrollViewHeight = useSharedValue<number>(0);
  const scrollViewScreenY = useSharedValue<number>(0);
  const totalCountShared = useSharedValue<number>(favoriteProducts.length);

  // Mantener totalCount sincronizado en UI thread
  useEffect(() => {
    totalCountShared.value = favoriteProducts.length;
  }, [favoriteProducts.length, totalCountShared]);

  // Estado JS para deshabilitar interacciones secundarias durante el drag
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // ── Referencia y Autoscroll del ScrollView ────────────────────────────────
  const aref = useAnimatedRef<Animated.ScrollView>();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Autoscroll continuo en UI Thread mediante useFrameCallback
  useFrameCallback(() => {
    'worklet';
    if (!isDragging.value || autoscrollSpeed.value === 0) return;

    const totalContentHeight = totalCountShared.value * ITEM_PITCH;
    const maxScroll = Math.max(0, totalContentHeight - scrollViewHeight.value + 60);
    const current = scrollY.value;
    const next = Math.max(0, Math.min(maxScroll, current + autoscrollSpeed.value));

    if (next !== current) {
      const delta = next - current;
      scrollY.value = next;
      scrollTo(aref, 0, next, false);

      // Compensar translationY para que la tarjeta se mantenga fija bajo el dedo
      translationY.value += delta;

      // Recalcular slot destino a medida que el contenido se desplaza
      const currentContentY = activeIndex.value * ITEM_PITCH + translationY.value;
      const targetSlot = Math.floor((currentContentY + ITEM_PITCH / 2) / ITEM_PITCH);
      const clampedSlot = Math.max(0, Math.min(totalCountShared.value - 1, targetSlot));
      if (hoverIndex.value !== clampedSlot) {
        hoverIndex.value = clampedSlot;
      }
    }
  });

  // ── Callbacks de Drag & Drop invocados desde Worklets mediante runOnJS ────
  const handleDragStart = useCallback((id: number) => {
    if (openCardId.current !== null) {
      cardRefs.current.get(openCardId.current)?.close();
      openCardId.current = null;
    }
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      // 1. Resetear inmediatamente los SharedValues para que en UI thread
      // todas las filas adopten transform: 0 plano (con withTiming duration 0),
      // cancelando cualquier resorte activo de desplazamiento antes del reordenamiento.
      isDragging.value = false;
      isTouchDown.value = false;
      activeId.value = -1;
      activeIndex.value = -1;
      hoverIndex.value = -1;
      translationY.value = 0;
      setDraggingId(null);

      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

      // 2. Reordenar el arreglo canónico de favoritos y persistir en FavoritesContext
      const next = [...favorites];
      if (fromIndex >= next.length || toIndex >= next.length) return;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      reorderFavorites(next);
    },
    [favorites, reorderFavorites, activeId, activeIndex, hoverIndex, isDragging, isTouchDown, translationY]
  );

  const handleDragCancel = useCallback(() => {
    isDragging.value = false;
    isTouchDown.value = false;
    activeId.value = -1;
    activeIndex.value = -1;
    hoverIndex.value = -1;
    translationY.value = 0;
    setDraggingId(null);
  }, [activeId, activeIndex, hoverIndex, isDragging, isTouchDown, translationY]);

  // ── Swipe-to-delete callbacks ─────────────────────────────────────────────
  const handleCardOpen = useCallback((id: number) => {
    if (openCardId.current !== null && openCardId.current !== id) {
      cardRefs.current.get(openCardId.current)?.close();
    }
    openCardId.current = id;
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (openCardId.current === id) openCardId.current = null;
      cardRefs.current.delete(id);
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const makeCardRef = useCallback(
    (id: number) => (handle: SwipeableFavoriteCardHandle | null) => {
      if (handle) {
        cardRefs.current.set(id, handle);
      } else {
        cardRefs.current.delete(id);
      }
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mis Favoritos</Text>

      {/* CASO 1: Carga inicial de AsyncStorage */}
      {!isFavoritesLoaded ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingSubtitle}>Cargando favoritos guardados...</Text>
        </View>
      ) : favorites.length === 0 ? (
        /* CASO 2: Sin favoritos */
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Favoritos</Text>
          <Text style={styles.subtitle}>Todavía no guardaste ningún producto.</Text>
        </View>
      ) : loadingApi && favoriteProducts.length === 0 ? (
        /* CASO 3: Sincronizando productos remotos */
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingSubtitle}>
            Sincronizando {favorites.length} producto{favorites.length === 1 ? '' : 's'} de tus
            favoritos...
          </Text>
        </View>
      ) : errorApi && favoriteProducts.length === 0 ? (
        /* CASO 4: Error de conexión */
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Error de conexión</Text>
          <Text style={styles.subtitle}>
            No pudimos sincronizar tus favoritos guardados ({errorApi}).
          </Text>
          <Pressable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        /* CASO 5: Lista de productos favoritos con Drag & Drop */
        <Animated.ScrollView
          ref={aref}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          scrollEnabled={draggingId === null}
          onLayout={(e) => {
            scrollViewHeight.value = e.nativeEvent.layout.height;
            scrollViewScreenY.value = e.nativeEvent.layout.y + 60; // 60 = page paddingTop
          }}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          onScrollBeginDrag={() => {
            if (openCardId.current !== null) {
              cardRefs.current.get(openCardId.current)?.close();
              openCardId.current = null;
            }
          }}
        >
          {favoriteProducts.map((item, index) => (
            <DraggableRow
              key={item.id}
              item={item}
              index={index}
              activeId={activeId}
              activeIndex={activeIndex}
              hoverIndex={hoverIndex}
              translationY={translationY}
              isDragging={isDragging}
              isTouchDown={isTouchDown}
              autoscrollSpeed={autoscrollSpeed}
              scrollViewScreenY={scrollViewScreenY}
              scrollViewHeight={scrollViewHeight}
              totalCountShared={totalCountShared}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              onDelete={handleDelete}
              onOpen={handleCardOpen}
              cardRef={makeCardRef(item.id)}
              isThisCardDragging={draggingId === item.id}
              isAnyDragging={draggingId !== null}
            />
          ))}
        </Animated.ScrollView>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  emptyContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  loadingSubtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8 },
  retryButton: {
    marginTop: 12,
    backgroundColor: colors.teal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 14,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    gap: CARD_GAP,
  },
  itemWrapper: {
    height: CARD_HEIGHT,
    zIndex: 1,
  },
});
