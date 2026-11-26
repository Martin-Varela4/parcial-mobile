import { useCart } from '@/features/cart/context/CartContext';
import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { mockProducts } from '@/features/products/data/mockProducts';
import { useFetch } from '@/features/products/hooks/useFetch';
import { FakeStoreProduct, Product } from '@/features/products/types';
import { adaptFakeStoreProduct } from '@/features/products/utils/adapter';
import { colors } from '@/theme/colors';
import { AppButton, CategoryBadge, PriceText } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const numericId = Number(id);

  // Consulta el producto individual desde FakeStoreAPI
  const {
    data: remoteProduct,
    loading,
  } = useFetch<FakeStoreProduct>(
    numericId ? `https://fakestoreapi.com/products/${numericId}` : null
  );

  // Resuelve el producto remoto adaptado o recurre al mock local como fallback
  const producto: Product | null = useMemo(() => {
    if (remoteProduct) {
      return adaptFakeStoreProduct(remoteProduct);
    }
    const local = mockProducts.find((item) => item.id === numericId);
    return local || null;
  }, [remoteProduct, numericId]);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (loading && !producto) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

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

  const elProductoEsFavorito = isFavorite(producto.id);

  const handleToggleFavorite = () => {
    toggleFavorite(producto.id);
  };

  const handleBuy = async () => {
    try {
      await addToCart(producto);
      Alert.alert(
        '¡Producto agregado!',
        `Añadiste "${producto.nombre}" al carrito.`,
        [
          { text: 'Seguir mirando', style: 'cancel' },
          {
            text: 'Ir al Carrito',
            onPress: () => router.push('/(tabs)/carrito'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'No se pudo agregar el producto al carrito.');
    }
  };

  const imageSource = typeof producto.imagen === 'string' ? { uri: producto.imagen } : producto.imagen;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.imageWrap}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
        />
        <Pressable onPress={() => router.back()} style={styles.backChip}>
          <Text style={styles.backChipText}>‹ Volver</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <CategoryBadge category={producto.categoria} variant="pill" size="md" />
        <Text style={styles.name}>{producto.nombre}</Text>
        <PriceText price={producto.precio} size="lg" weight="bold" />
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

          <AppButton
            title="Comprar Ahora"
            onPress={handleBuy}
            variant="primary"
            size="lg"
            style={styles.buyButton}
          />
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
  loadingText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  notFound: { fontSize: 17, fontWeight: '700', color: colors.ink },
  imageWrap: {
    width: '100%',
    height: 320,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
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
  name: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, lineHeight: 28 },
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
  },
});
