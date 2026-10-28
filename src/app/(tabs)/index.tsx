import { FlatList, StyleSheet, Text, View } from 'react-native';
import ProductCard from '@/features/products/components/ProductCard';
import { mockProducts } from '@/features/products/data/mockProducts';
import { colors } from '@/theme/colors';

export default function Catalogo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo</Text>
      <FlatList
        data={mockProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ProductCard {...item} alt={index % 2 === 1} />
        )}
        contentContainerStyle={styles.list}
      />
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
  list: { paddingBottom: 40 },
});
