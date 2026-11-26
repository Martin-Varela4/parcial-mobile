import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';

interface CartSummaryProps {
  totalItems: number;
  totalAmount: number;
  onCheckout: () => void;
  onClear: () => void;
}

export function CartSummary({
  totalItems,
  totalAmount,
  onCheckout,
  onClear,
}: CartSummaryProps) {
  return (
    <View style={styles.container}>
      {/* Detalle de unidades y total */}
      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Cantidad de artículos</Text>
          <Text style={styles.value}>
            {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total general</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCheckout}
          accessibilityRole="button"
          accessibilityLabel="Finalizar compra"
        >
          <Ionicons name="bag-check-outline" size={20} color={colors.bg} />
          <Text style={styles.checkoutText}>Finalizar Compra</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Vaciar carrito"
        >
          <Text style={styles.clearText}>Vaciar carrito</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: colors.bgAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.muted,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.amber,
  },
  actions: {
    gap: 8,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutText: {
    color: colors.bg,
    fontWeight: '900',
    fontSize: 15,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  clearText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
