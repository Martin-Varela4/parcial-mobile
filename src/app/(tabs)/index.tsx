import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProductCard from '@/features/products/components/ProductCard';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';

export default function Catalogo() {
  const {
    data: rawProducts,
    loading,
    error,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  const products = useMemo(() => {
    if (!Array.isArray(rawProducts)) return [];
    return rawProducts.map(adaptFakeStoreProduct);
  }, [rawProducts]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo</Text>

      {/* 1. Estado de Carga Inicial */}
      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : null}

      {/* 2. Estado de Error */}
      {error && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Ocurrió un error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 3. Catálogo Vacío */}
      {!loading && !error && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Catálogo vacío</Text>
          <Text style={styles.emptySubtitle}>No se encontraron productos disponibles.</Text>
          <Pressable onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Actualizar</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 4. Lista de Productos Recibidos con Pull-to-Refresh */}
      {products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <ProductCard {...item} alt={index % 2 === 1} />
          )}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refetch}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.ink,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  list: { paddingBottom: 80 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 14,
  },
});
