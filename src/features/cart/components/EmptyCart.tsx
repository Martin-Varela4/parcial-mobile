import { AppButton, AppText } from '@/components/ui';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export function EmptyCart() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="cart-outline" size={72} color={colors.muted} />
      </View>

      <AppText variant="title" align="center">
        Tu carrito está vacío
      </AppText>
      <AppText variant="subtitle" align="center">
        Explorá nuestro catálogo y sumá tus productos favoritos para comenzar tu compra.
      </AppText>

      <AppButton
        title="Explorar Catálogo"
        onPress={() => router.push('/(tabs)')}
        variant="primary"
        size="lg"
        icon={<Ionicons name="grid-outline" size={18} color={colors.bg} />}
        accessibilityLabel="Explorar catálogo"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  button: {
    marginTop: 12,
  },
});
