/**
 * Favoritos — Pantalla principal de favoritos.
 *
 * Arquitectura basada en las directivas de Semana 10 (TP N.º 7):
 *  - DraggableFlatList (react-native-draggable-flatlist) para el reordenamiento.
 *  - ReanimatedSwipeable (react-native-gesture-handler/ReanimatedSwipeable) para eliminación horizontal.
 *  - Confirmación explícita mediante Alert.alert() antes de eliminar.
 *  - Separación de zonas (Diapositiva 18):
 *      1. Zona Swipeable: cubre el cuerpo de la tarjeta del producto.
 *      2. Asa "Mover": botón independiente con onLongPress={drag} y delayLongPress={350}.
 *  - Persistencia de orden y eliminaciones en FavoritesContext + AsyncStorage (Diapositiva 17).
 */

import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { FavoriteProductCard } from '@/features/favorites/components/FavoriteProductCard';
import { SwipeRow } from '@/features/favorites/components/SwipeRow';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct, Product } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';

export default function Favoritos() {
  const router = useRouter();
  const { favorites, isFavoritesLoaded, toggleFavorite, reorderFavorites } = useFavorites();

  // ── Productos remotos con fallback de seguridad ──────────────────────────
  const {
    data: rawProducts,
    loading: loadingApi,
    error: errorApi,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  const allAvailableProducts = useMemo(() => {
    const list: Product[] = [];
    if (Array.isArray(rawProducts) && rawProducts.length > 0) {
      list.push(...rawProducts.map(adaptFakeStoreProduct));
    }
    // Aseguramos que mockProducts esté siempre disponible como fallback seguro
    mockProducts.forEach((mock) => {
      if (!list.some((p) => p.id === mock.id)) {
        list.push(mock);
      }
    });
    return list;
  }, [rawProducts]);

  // Lista canónica en el orden persistido en favorites[]
  const favoriteProducts = useMemo(
    () =>
      favorites
        .map((id) => allAvailableProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
    [allAvailableProducts, favorites]
  );

  // ── Confirmación de eliminación con Alert.alert (Diapositiva 9) ──────────
  const confirmDelete = useCallback(
    (id: number) => {
      Alert.alert('Eliminar favorito', '¿Querés quitarlo?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            toggleFavorite(id);
          },
        },
      ]);
    },
    [toggleFavorite]
  );

  // ── Renderizado de fila con separación de zonas (Diapositiva 18) ─────────
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Product>) => {
      return (
        <ScaleDecorator>
          <View style={[styles.rowContainer, isActive && styles.rowContainerActive]}>
            {/* Zona 1: Swipeable para el producto (Diapositivas 8 y 18) */}
            <View style={styles.swipeWrapper}>
              <SwipeRow onDelete={() => confirmDelete(item.id)}>
                <FavoriteProductCard
                  item={item}
                  onPress={() => {
                    router.push({
                      pathname: '/producto/[id]',
                      params: { id: String(item.id) },
                    });
                  }}
                />
              </SwipeRow>
            </View>

            {/* Zona 2: Asa de arrastre independiente "Mover" (Diapositiva 18) */}
            <Pressable
              onLongPress={drag}
              delayLongPress={350}
              disabled={isActive}
              style={[styles.dragHandle, isActive && styles.dragHandleActive]}
              accessibilityRole="button"
              accessibilityLabel={`Mover ${item.nombre}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="reorder-two-outline"
                size={22}
                color={isActive ? colors.teal : colors.muted}
              />
              <Text style={[styles.dragHandleText, isActive && styles.dragHandleTextActive]}>
                Mover
              </Text>
            </Pressable>
          </View>
        </ScaleDecorator>
      );
    },
    [confirmDelete, router]
  );

  // ── Actualización del orden mediante onDragEnd (Diapositivas 14 y 16) ────
  const handleDragEnd = useCallback(
    ({ data }: { data: Product[] }) => {
      // El array 'data' viene ya reordenado por DraggableFlatList (sin mutaciones manuales)
      reorderFavorites(data.map((p) => p.id));
    },
    [reorderFavorites]
  );

  const keyExtractor = useCallback((item: Product) => String(item.id), []);

  // ── Render de Pantalla ────────────────────────────────────────────────────
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
        /* CASO 2: Sin favoritos guardados */
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
        /* CASO 5: Lista reordenable DraggableFlatList (Semana 10 - TP N.º 7) */
        <DraggableFlatList
          data={favoriteProducts}
          keyExtractor={keyExtractor}
          renderItem={renderDraggableItem}
          onDragEnd={handleDragEnd}
          containerStyle={styles.list}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshing={loadingApi}
          onRefresh={refetch}
        />
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 90,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    width: '100%',
  },
  rowContainerActive: {
    opacity: 0.95,
  },
  swipeWrapper: {
    flex: 1,
  },
  dragHandle: {
    width: 62,
    height: 92,
    backgroundColor: colors.bgAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dragHandleActive: {
    borderColor: colors.teal,
    backgroundColor: colors.bg,
    elevation: 6,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  dragHandleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  dragHandleTextActive: {
    color: colors.teal,
  },
});
