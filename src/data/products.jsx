import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
//import { colors } from '../../theme/colors';

const colors = {
  bg: '#101426',      // fondo base — azul noche
  bgAlt: '#1B2140',   // fondo alterno — franjas del catálogo y hoja de detalle
  line: '#2A3157',    // líneas divisorias sutiles
  ink: '#F4F1FF',     // texto principal sobre fondo oscuro
  muted: '#8891B5',   // texto secundario
  amber: '#FFC53D',   // acento cálido — precios
  teal: '#2EC4B6',    // acento frío — categorías / estado activo
};
 
export const products = [
  {
    id: 1,
    nombre: "Remera Oversize Verde",
    precio: 25000,
    categoria: "Indumentaria",
    imagen: require('../../assets/products/remera.jpg'), 
    descripcion: "Confeccionada en algodón 100% peinado de alto gramaje. Diseñada con un calce oversize urbano, cuello redondo con rib grueso y costuras reforzadas para garantizar una máxima durabilidad y un confort diario excepcional."
  },
  {
    id: 2,
    nombre: "Zapatillas Urbanas Blancas",
    precio: 65000,
    categoria: "Calzado",
    imagen: require('../../assets/products/zapatilla.jpg'),
    descripcion: "Zapatillas de diseño vanguardista con capellada de malla respirable y refuerzos en cuero sintético. Cuentan con una entresuela de EVA ligera que amortigua cada pisada y una suela de goma antideslizante ideal para el asfalto."
  },
  {
    id: 3,
    nombre: "Gorra Snapback Navy",
    precio: 15000,
    categoria: "Accesorios",
    imagen: require('../../assets/products/gorra.jpg'),
    descripcion: "Gorra con visera plana estructurada de 6 paneles. Incluye ojales bordados para una ventilación óptima y un cierre plástico regulable en la parte trasera que se adapta cómodamente a cualquier medida."
  },
];

export default function ProductCard({
  id,
  nombre,
  precio,
  categoria,
  imagen,
  alt = false,
}) {
  const router = useRouter();

  function abrirDetalle() {
    router.push({
      pathname: '/producto/[id]',
      params: { id: String(id) },
    });
  }

  return (
    <Pressable
      onPress={abrirDetalle}
      style={[styles.row, alt && styles.rowAlt]}
    >
      <Image source={imagen} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{categoria}</Text>
        </View>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.price}>$ {precio.toLocaleString('es-AR')}</Text>
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
  image: { width: 96, height: 96, borderRadius: 6 },
  info: { flex: 1, gap: 6 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.bg },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  price: { fontSize: 15, fontWeight: '800', color: colors.amber },
});