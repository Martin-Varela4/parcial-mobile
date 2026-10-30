import React, { useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import SwipeableFavoriteCard, {
  SwipeableFavoriteCardHandle,
} from '@/features/favorites/components/SwipeableFavoriteCard';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct, Product } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';

export default function Favoritos() {
  const { favorites, isFavoritesLoaded, toggleFavorite } = useFavorites();

  // ── Refs para controlar tarjetas abiertas ────────────────────────────────
  /**
   * Mapa de refs de cada SwipeableFavoriteCard, indexado por id de producto.
   * Permite cerrar la tarjeta que estaba abierta cuando se abre otra.
   */
  const cardRefs = useRef<Map<number, SwipeableFavoriteCardHandle>>(new Map());
  /** Referencia al id de la tarjeta actualmente abierta. */
  const openCardId = useRef<number | null>(null);

  // ── Productos remotos ────────────────────────────────────────────────────
  const {
    data: rawProducts,
    loading: loadingApi,
    error: errorApi,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  // Consolida productos remotos y locales (sin duplicar por ID).
  const allAvailableProducts = useMemo(() => {
    const remote = Array.isArray(rawProducts)
      ? rawProducts.map(adaptFakeStoreProduct)
      : [];
    const map = new Map<number, Product>();
    mockProducts.forEach((p) => map.set(p.id, p));
    remote.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [rawProducts]);

  // Filtra únicamente los favoritos activos.
  const misProductosFavoritos = useMemo(
    () => allAvailableProducts.filter((item) => favorites.includes(item.id)),
    [allAvailableProducts, favorites]
  );

  // ── Callbacks para la tarjeta ────────────────────────────────────────────

  /**
   * Se invoca cuando una tarjeta se abre. Cierra la anterior si existía.
   */
  const handleCardOpen = useCallback((id: number) => {
    if (openCardId.current !== null && openCardId.current !== id) {
      cardRefs.current.get(openCardId.current)?.close();
    }
    openCardId.current = id;
  }, []);

  /**
   * Elimina el producto de favoritos llamando a `toggleFavorite`.
   * La persistencia en AsyncStorage la gestiona el contexto internamente.
   */
  const handleDelete = useCallback(
    (id: number) => {
      // Limpiar el estado de "abierta" antes de eliminar.
      if (openCardId.current === id) {
        openCardId.current = null;
      }
      cardRefs.current.delete(id);
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  // ── Render de cada item ──────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      return (
        <SwipeableFavoriteCard
          ref={(handle) => {
            if (handle) {
              cardRefs.current.set(item.id, handle);
            } else {
              cardRefs.current.delete(item.id);
            }
          }}
          item={item}
          onDelete={handleDelete}
          onOpen={() => handleCardOpen(item.id)}
        />
      );
    },
    [handleDelete, handleCardOpen]
  );

  const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mis Favoritos</Text>

      {/* CASO 1: Carga inicial del almacenamiento local (AsyncStorage) */}
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
      ) : loadingApi && misProductosFavoritos.length === 0 ? (
        /* CASO 3: Favoritos guardados, productos remotos cargando */
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingSubtitle}>
            Sincronizando {favorites.length} producto{favorites.length === 1 ? '' : 's'} de tus
            favoritos...
          </Text>
        </View>
      ) : errorApi && misProductosFavoritos.length === 0 ? (
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
        /* CASO 5: Productos favoritos disponibles */
        <FlatList
          data={misProductosFavoritos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          refreshing={loadingApi}
          onRefresh={refetch}
          // Cerrar la tarjeta activa cuando el usuario comienza a hacer scroll.
          onScrollBeginDrag={() => {
            if (openCardId.current !== null) {
              cardRefs.current.get(openCardId.current)?.close();
              openCardId.current = null;
            }
          }}
        />
      )}
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

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
  listContent: { paddingHorizontal: 24, gap: 12, paddingBottom: 80 },
});
