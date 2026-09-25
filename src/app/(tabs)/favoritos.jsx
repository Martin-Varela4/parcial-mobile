import { StyleSheet, Text, View, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { products } from '../../data/products'; // Asegúrate de que la ruta a tus datos sea correcta
import { useFavorites } from '../../context/FavoritesContext'; // Tu nuevo contexto global

const colors = {
  bg: '#101426',      
  bgAlt: '#1B2140',   
  line: '#2A3157',    
  ink: '#F4F1FF',     
  muted: '#8891B5',   
  amber: '#FFC53D',   
  teal: '#2EC4B6',    
};

export default function Favoritos() {
  const router = useRouter();
  const { favorites } = useFavorites(); // ⚡ Obtenemos la lista de IDs guardados

  // Filtrar el array original de productos para dejar solo los que su ID esté en favoritos
  const misProductosFavoritos = products.filter((item) => favorites.includes(item.id));

  // Renderizado de cada tarjeta de favorito de forma compacta e integrada
  const renderItem = ({ item }) => (
    <Pressable 
      style={styles.card} 
      onPress={() => router.push(`/product/${item.id}`)} // Te redirige al detalle del producto
    >
      <Image source={item.imagen} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.cardCategory}>{item.categoria}</Text>
        <Text style={styles.cardPrice}>\$ {item.precio.toLocaleString('es-AR')}</Text>
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
    paddingTop: 60, // Espacio superior para que no se pegue al notch
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
  
  // Estilos de la lista de productos
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
