import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { AppButton, AppText } from '@/components/ui';
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
      <AppText variant="screenTitle" style={styles.title}>
        Catálogo
      </AppText>

      {/* 1. Estado de Carga Inicial */}
      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
          <AppText variant="subtitle">Cargando productos...</AppText>
        </View>
      ) : null}

      {/* 2. Estado de Error */}
      {error && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <AppText variant="title">Ocurrió un error</AppText>
          <AppText variant="subtitle" align="center">
            {error}
          </AppText>
          <AppButton title="Reintentar" onPress={refetch} variant="primary" size="md" />
        </View>
      ) : null}

      {/* 3. Catálogo Vacío */}
      {!loading && !error && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <AppText variant="title">Catálogo vacío</AppText>
          <AppText variant="subtitle" align="center">
            No se encontraron productos disponibles.
          </AppText>
          <AppButton title="Actualizar" onPress={refetch} variant="primary" size="md" />
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
});
