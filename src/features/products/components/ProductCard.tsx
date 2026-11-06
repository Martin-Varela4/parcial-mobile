import { useRouter } from 'expo-router';
import { GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { colors } from '@/theme/colors';
import { ProductCardProps } from '../types';
import { formatCurrency } from '@/utils/formatters';

export default function ProductCard({
  id,
  nombre,
  precio,
  categoria,
  imagen,
  alt = false,
}: ProductCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);

  function abrirDetalle() {
    router.push({
      pathname: '/producto/[id]',
      params: { id: String(id) },
    });
  }

  function handleFavoritePress(e: GestureResponderEvent) {
    e.stopPropagation();
    toggleFavorite(id);
  }

  const imageSource = typeof imagen === 'string' ? { uri: imagen } : imagen;

  return (
    <Pressable
      onPress={abrirDetalle}
      style={[styles.row, alt && styles.rowAlt]}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${nombre}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
        />
        <Pressable
          onPress={handleFavoritePress}
          style={({ pressed }) => [
            styles.favButton,
            pressed && styles.favButtonPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={
            isFav
              ? `Quitar ${nombre} de favoritos`
              : `Agregar ${nombre} a favoritos`
          }
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? '#E53935' : colors.muted}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{categoria}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {nombre}
        </Text>
        <Text style={styles.price}>{formatCurrency(precio)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: colors.bg,
  },
  rowAlt: {
    backgroundColor: colors.bgAlt,
  },
  imageContainer: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#FFFFFF', // Fondo blanco para imágenes transparentes de FakeStoreAPI
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra sutil para destacar sobre imágenes con fondo blanco
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  favButtonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.85,
  },
  info: { flex: 1, gap: 6 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.bg },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 22 },
  price: { fontSize: 15, fontWeight: '800', color: colors.amber },
});
