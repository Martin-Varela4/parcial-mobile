import { StyleSheet, Text, View, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { Product } from '@/features/products/types';

export default function Favoritos() {
  const router = useRouter();
  const { favorites } = useFavorites();

  const misProductosFavoritos = mockProducts.filter((item) =>
    favorites.includes(item.id)
  );

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/producto/[id]',
          params: { id: String(item.id) },
        })
      }
    >
      <Image source={item.imagen} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={styles.cardCategory}>{item.categoria}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(item.precio)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.page}>
      <Text style={styles.titleScreen}>Mis Favoritos</Text>

      {misProductosFavoritos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Favoritos</Text>
          <Text style={styles.subtitle}>Todavía no guardaste ningún producto.</Text>
        </View>
      ) : (
        <FlatList
          data={misProductosFavoritos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
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
  listContent: { paddingHorizontal: 24, gap: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardImage: {
    width: 90,
    height: 90,
    backgroundColor: colors.line,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 2,
  },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardCategory: { fontSize: 12, color: colors.teal, fontWeight: '600' },
  cardPrice: { fontSize: 15, fontWeight: '800', color: colors.amber, marginTop: 4 },
});
