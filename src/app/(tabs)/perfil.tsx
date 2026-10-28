import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export default function Perfil() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Iniciá sesión para ver tus datos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
