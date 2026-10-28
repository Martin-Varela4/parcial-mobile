import { useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct, Product } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

export default function Favoritos() {
  const router = useRouter();
  const { favorites } = useFavorites();

  // Consulta los productos remotos para poder resolver favoritos agregados desde FakeStoreAPI
  const {
    data: rawProducts,
    loading,
    refetch,
  } = useFetch<FakeStoreProduct[]>('https://fakestoreapi.com/products');

  // Consolida productos remotos y locales (evitando duplicaciones por ID)
  const allAvailableProducts = useMemo(() => {
    const remote = Array.isArray(rawProducts)
      ? rawProducts.map(adaptFakeStoreProduct)
      : [];
    const map = new Map<number, Product>();
    mockProducts.forEach((p) => map.set(p.id, p));
    remote.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [rawProducts]);

  // Filtra los productos favoritos activos
  const misProductosFavoritos = useMemo(() => {
    return allAvailableProducts.filter((item) => favorites.includes(item.id));
  }, [allAvailableProducts, favorites]);

  const renderItem = ({ item }: { item: Product }) => {
    const imageSource =
      typeof item.imagen === 'string' ? { uri: item.imagen } : item.imagen;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/producto/[id]',
            params: { id: String(item.id) },
          })
        }
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
      </Pressable>
    );
  };

  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mis Favoritos</Text>

      {misProductosFavoritos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Favoritos</Text>
          <Text style={styles.subtitle}>
            {loading
              ? 'Verificando productos guardados...'
              : 'Todavía no guardaste ningún producto.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={misProductosFavoritos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

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
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, gap: 12, paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
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
});
