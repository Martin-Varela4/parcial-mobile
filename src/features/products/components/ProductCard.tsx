import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

  function abrirDetalle() {
    router.push({
      pathname: '/producto/[id]',
      params: { id: String(id) },
    });
  }

  const imageSource = typeof imagen === 'string' ? { uri: imagen } : imagen;

  return (
    <Pressable
      onPress={abrirDetalle}
      style={[styles.row, alt && styles.rowAlt]}
    >
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="contain"
      />
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
  image: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#FFFFFF', // Fondo blanco para imágenes transparentes de FakeStoreAPI
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
