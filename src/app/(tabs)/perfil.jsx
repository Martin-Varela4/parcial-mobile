import { StyleSheet, Text, View } from 'react-native';
//import { colors } from '../../../theme/colors';

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
 