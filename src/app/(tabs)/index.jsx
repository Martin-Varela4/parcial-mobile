import { FlatList, StyleSheet, Text, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import { products } from '../../data/products';
// import { colors } from '../../../theme/colors';

const colors = {
  bg: '#101426',      // fondo base — azul noche
  bgAlt: '#1B2140',   // fondo alterno — franjas del catálogo y hoja de detalle
  line: '#2A3157',    // líneas divisorias sutiles
  ink: '#F4F1FF',     // texto principal sobre fondo oscuro
  muted: '#8891B5',   // texto secundario
  amber: '#FFC53D',   // acento cálido — precios
  teal: '#2EC4B6',    // acento frío — categorías / estado activo
};
  // 👈 Agrega esto temporalmente
 
export default function Catalogo() {
    console.log("¿Qué hay en products?:", products)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo</Text>
      <FlatList
        data={products}
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