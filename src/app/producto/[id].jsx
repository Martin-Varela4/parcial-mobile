import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { products } from '../../data/products';
// Importamos el hook global
import { useFavorites } from '../../context/FavoritesContext'; 

const colors = {
  bg: '#101426',
  bgAlt: '#1B2140',
  line: '#2A3157',
  ink: '#F4F1FF',
  muted: '#8891B5',
  amber: '#FFC53D',
  teal: '#2EC4B6',
}; 

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const producto = products.find((item) => item.id === Number(id)); 

  // ⚡ Consumimos la lógica global de favoritos
  const { toggleFavorite, isFavorite } = useFavorites(); 

  // Si el producto no existe, devolvemos la vista de error
  if (!producto) {
    return ( 
      <View style={styles.center}>
        <Text style={styles.notFound}>No encontramos este producto</Text>
        <Pressable onPress={() => router.back()} style={styles.backChip}>
          <Text style={styles.backChipText}>Volver</Text>
        </Pressable>
      </View>
    );
  } 

  // Comprobamos de manera persistente si este producto actual está en la lista global
  const elProductoEsFavorito = isFavorite(producto.id); 

  const handleToggleFavorite = () => {
    toggleFavorite(producto.id);
  }; 

  const handleBuy = () => {
    Alert.alert("Compra Iniciada", `Añadiste ${producto.nombre} al carrito.`);
  }; 

  return ( 
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.imageWrap}>
        <Image source={producto.imagen} style={styles.image} />
        <Pressable onPress={() => router.back()} style={styles.backChip}>
          <Text style={styles.backChipText}>‹ Volver</Text>
        </Pressable>
      </View>
 
      <View style={styles.sheet}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{producto.categoria}</Text>
        </View>
        <Text style={styles.name}>{producto.nombre}</Text>
        <Text style={styles.price}>
          \$ {producto.precio.toLocaleString('es-AR')}
        </Text>
        <Text style={styles.description}>{producto.descripcion}</Text>

        <View style={styles.actionsRow}>
          <Pressable 
            onPress={handleToggleFavorite} 
            style={[styles.favButton, elProductoEsFavorito && styles.favButtonActive]}
          >
            <Text style={styles.favButtonText}>
              {elProductoEsFavorito ? '❤️ En Favoritos' : '🤍 Añadir a Favoritos'}
            </Text>
          </Pressable>

          <Pressable onPress={handleBuy} style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Comprar Ahora</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
} 

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFound: { fontSize: 17, fontWeight: '700', color: colors.ink },
  imageWrap: { width: '100%', height: 320 },
  image: { width: '100%', height: '100%' },
  backChip: {
    position: 'absolute',
    top: 56,
    left: 20,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backChipText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  sheet: {
    backgroundColor: colors.bgAlt,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 10,
    flex: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.bg },
  name: { fontSize: 26, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  price: { fontSize: 20, fontWeight: '800', color: colors.amber },
  description: { fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 6, marginBottom: 20 },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 10,
  },
  favButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  favButtonActive: {
    backgroundColor: colors.line,
    borderColor: colors.teal,
  },
  favButtonText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  buyButton: {
    flex: 1.2,
    backgroundColor: colors.teal,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  buyButtonText: {
    color: colors.bg,
    fontWeight: '900',
    fontSize: 15,
  },
});
