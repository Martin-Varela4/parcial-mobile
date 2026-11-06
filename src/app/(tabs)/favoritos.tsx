/**
 * Favoritos — pantalla principal de productos favoritos.
 *
 * Interacciones:
 *  1. Toque normal      → navegar al detalle del producto.
 *  2. Deslizar ←        → revelar acción de eliminar (swipe-to-delete).
 *  3. Mantener presionado + arrastrar ↕ → reordenar (drag & drop).
 *  4. Scroll vertical normal → se desplaza la lista (sin activar reordenamiento).
 *
 * Implementación del Drag & Drop:
 *  - Se usa un ScrollView para poder desactivar el scroll nativo mientras
 *    el usuario arrastra, evitando conflictos de gestos.
 *  - Gesture.LongPress (minDuration: 400 ms) activa el modo de arrastre.
 *  - Gesture.Pan (simultáneo al LongPress) mueve la tarjeta.
 *  - Cada DraggableRow posee su propio useSharedValue (offsetY).
 *  - Al soltar se calcula la nueva posición y se llama a reorderFavorites.
 *  - `userOrderedIds` guarda el orden decidido por el usuario (solo IDs).
 *    `orderedProducts` se deriva de él via useMemo, sin setState en effects.
 *
 * Compatibilidad: Expo Go (sin código nativo adicional).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Duración mínima de pulsación para activar el reordenamiento. */
const LONG_PRESS_MIN_DURATION = 400;

/** Configuración spring al soltar una tarjeta. */
const DROP_SPRING = { damping: 22, stiffness: 220, mass: 0.7 };

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ItemLayout {
  y: number;
  height: number;
}

// ─── Sub-componente: fila arrastrable ─────────────────────────────────────────

interface DraggableRowProps {
  item: Product;
  isDragging: boolean;
  /** Notifica al padre que el long press comenzó. */
  onDragStart: (id: number) => void;
  /** Notifica al padre que el arrastre terminó con la posición Y absoluta. */
  onDragEnd: (id: number, absoluteY: number) => void;
  onDelete: (id: number) => void;
  onOpen: (id: number) => void;
  onLayout: (id: number, e: LayoutChangeEvent) => void;
  cardRef: (handle: SwipeableFavoriteCardHandle | null) => void;
}

/**
 * Cada DraggableRow posee su propio useSharedValue para el desplazamiento Y.
 * Así el padre nunca toca shared values ajenos (cumple react-hooks/immutability).
 */
const DraggableRow = React.memo(function DraggableRow({
  item,
  isDragging,
  onDragStart,
  onDragEnd,
  onDelete,
  onOpen,
  onLayout,
  cardRef,
}: DraggableRowProps) {
  const id = item.id;
  // Owned por esta instancia — ningún prop externo lo modifica.
  const dragOffsetY = useSharedValue(0);

  const draggedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: isDragging ? dragOffsetY.value : 0 }],
    zIndex: isDragging ? 999 : 1,
  }));

  // Refs para que los worklets capturen siempre los callbacks más recientes
  // sin necesitar recrear el objeto Gesture.
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  // El gesto se crea una sola vez (ref). Los worklets leen los callbacks a
  // través de los refs para evitar closures obsoletos.
  const gestureRef = useRef<ReturnType<typeof Gesture.Simultaneous> | null>(null);
  if (gestureRef.current === null) {
    const longPress = Gesture.LongPress()
      .minDuration(LONG_PRESS_MIN_DURATION)
      .onStart(() => {
        'worklet';
        dragOffsetY.value = 0;
        runOnJS(onDragStartRef.current)(id);
      });

    const pan = Gesture.Pan()
      .onUpdate((e) => {
        'worklet';
        dragOffsetY.value = e.translationY;
      })
      .onEnd((e) => {
        'worklet';
        const finalY = e.absoluteY;
        dragOffsetY.value = withSpring(0, DROP_SPRING);
        runOnJS(onDragEndRef.current)(id, finalY);
      })
      .onFinalize((e) => {
        'worklet';
        dragOffsetY.value = withSpring(0, DROP_SPRING);
        runOnJS(onDragEndRef.current)(id, e.absoluteY);
      });

    gestureRef.current = Gesture.Simultaneous(longPress, pan);
  }

  return (
    <GestureDetector gesture={gestureRef.current}>
      <Animated.View
        style={[styles.itemWrapper, draggedStyle]}
        onLayout={(e) => onLayout(id, e)}
      >
        <SwipeableFavoriteCard
          ref={cardRef}
          item={item}
          onDelete={onDelete}
          onOpen={() => onOpen(id)}
          isDragging={isDragging}
        />
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Favoritos() {
  const { favorites, isFavoritesLoaded, toggleFavorite, reorderFavorites } = useFavorites();

  // ── Refs para controlar tarjetas con swipe abierto ────────────────────────
  const cardRefs = useRef<Map<number, SwipeableFavoriteCardHandle>>(new Map());
  const openCardId = useRef<number | null>(null);

  // ── Productos remotos ────────────────────────────────────────────────────
  const {
    data: rawProducts,
    loading: loadingApi,
    error: errorApi,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  const allAvailableProducts = useMemo(() => {
    const remote = Array.isArray(rawProducts)
      ? rawProducts.map(adaptFakeStoreProduct)
      : [];
    const map = new Map<number, Product>();
    mockProducts.forEach((p) => map.set(p.id, p));
    remote.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [rawProducts]);

  /**
   * Lista base en el orden persistido (favorites[]).
   * Es la fuente de verdad de qué productos están en favoritos.
   */
  const baseFavoriteProducts = useMemo(
    () =>
      favorites
        .map((id) => allAvailableProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
    [allAvailableProducts, favorites]
  );

  // ── Orden decidido por el usuario (solo IDs) ──────────────────────────────
  /**
   * `userOrderedIds` guarda el orden que el usuario estableció via DnD.
   * Arranca vacío; se puebla cuando el usuario arrastra por primera vez.
   *
   * `orderedProducts` se deriva mediante useMemo:
   *   1. Coloca primero los ítems según el orden del usuario (si existen).
   *   2. Agrega al final cualquier favorito nuevo que no esté en userOrderedIds.
   *   3. Omite automáticamente IDs que ya no estén en baseFavoriteProducts.
   *
   * Esta derivación pura evita necesitar setState en effects (cumple
   * react-hooks/set-state-in-effect) y refs durante render.
   */
  const [userOrderedIds, setUserOrderedIds] = useState<number[]>([]);

  const orderedProducts = useMemo(() => {
    const baseMap = new Map(baseFavoriteProducts.map((p) => [p.id, p]));
    // 1. Ítems en el orden del usuario que aún existan en base
    const ordered = userOrderedIds
      .map((id) => baseMap.get(id))
      .filter((p): p is Product => p !== undefined);
    // 2. Ítems de base que el usuario aún no ha ordenado (recién agregados)
    const orderedSet = new Set(userOrderedIds);
    const newItems = baseFavoriteProducts.filter((p) => !orderedSet.has(p.id));
    return [...ordered, ...newItems];
  }, [userOrderedIds, baseFavoriteProducts]);

  // ── Medición de layouts ───────────────────────────────────────────────────
  const itemLayouts = useRef<Map<number, ItemLayout>>(new Map());

  const handleItemLayout = useCallback(
    (id: number, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      itemLayouts.current.set(id, { y, height });
    },
    []
  );

  // ── Drag & Drop — estado ──────────────────────────────────────────────────

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const draggingIdRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // ── Callbacks del Drag & Drop ─────────────────────────────────────────────

  const handleDragStart = useCallback((id: number) => {
    if (openCardId.current !== null) {
      cardRefs.current.get(openCardId.current)?.close();
      openCardId.current = null;
    }
    draggingIdRef.current = id;
    setDraggingId(id);
    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: false });
  }, []);

  const handleDragEnd = useCallback(
    (id: number, absoluteY: number) => {
      if (draggingIdRef.current !== id) return;
      draggingIdRef.current = null;
      setDraggingId(null);
      scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });

      setUserOrderedIds((prevUserIds) => {
        // Construir la lista actual en el orden que ve el usuario
        const baseMap = new Map(baseFavoriteProducts.map((p) => [p.id, p]));
        const orderedNow: Product[] = [
          ...prevUserIds.map((i) => baseMap.get(i)).filter((p): p is Product => !!p),
          ...baseFavoriteProducts.filter((p) => !prevUserIds.includes(p.id)),
        ];

        const dragIndex = orderedNow.findIndex((p) => p.id === id);
        if (dragIndex === -1) return prevUserIds;

        const draggedLayout = itemLayouts.current.get(id);
        const draggedH = draggedLayout?.height ?? 90;
        const centerY = absoluteY + scrollOffsetRef.current - draggedH / 2;

        let targetIndex = orderedNow.length - 1;
        for (let i = 0; i < orderedNow.length; i++) {
          const layout = itemLayouts.current.get(orderedNow[i].id);
          if (!layout) continue;
          if (centerY < layout.y + layout.height / 2) {
            targetIndex = i;
            break;
          }
        }

        if (targetIndex === dragIndex) return prevUserIds;

        const next = [...orderedNow];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(targetIndex, 0, moved);

        const nextIds = next.map((p) => p.id);
        reorderFavorites(nextIds);
        return nextIds;
      });
    },
    [baseFavoriteProducts, reorderFavorites]
  );

  // ── Swipe-to-delete — callbacks ───────────────────────────────────────────

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
    (id: number) =>
      (handle: SwipeableFavoriteCardHandle | null) => {
        if (handle) {
          cardRefs.current.set(id, handle);
        } else {
          cardRefs.current.delete(id);
        }
      },
    []
  );

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mis Favoritos</Text>

      {/* CASO 1: Carga inicial del almacenamiento local */}
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
      ) : loadingApi && baseFavoriteProducts.length === 0 ? (
        /* CASO 3: Favoritos guardados, productos remotos cargando */
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingSubtitle}>
            Sincronizando {favorites.length} producto{favorites.length === 1 ? '' : 's'} de tus
            favoritos...
          </Text>
        </View>
      ) : errorApi && baseFavoriteProducts.length === 0 ? (
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
        /* CASO 5: Productos disponibles — lista con DnD */
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          onScrollBeginDrag={() => {
            if (openCardId.current !== null) {
              cardRefs.current.get(openCardId.current)?.close();
              openCardId.current = null;
            }
          }}
        >
          {orderedProducts.map((item) => (
            <DraggableRow
              key={item.id}
              item={item}
              isDragging={draggingId === item.id}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDelete={handleDelete}
              onOpen={handleCardOpen}
              onLayout={handleItemLayout}
              cardRef={makeCardRef(item.id)}
            />
          ))}
        </ScrollView>
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
    gap: 12,
  },
  itemWrapper: {
    zIndex: 1,
  },
});
