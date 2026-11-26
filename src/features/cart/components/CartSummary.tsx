import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, Card, PriceText } from '@/components/ui';
import { colors } from '@/theme/colors';

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
      <Card padding="md" radius="md" border style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Cantidad de artículos</Text>
          <Text style={styles.value}>
            {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total general</Text>
          <PriceText price={totalAmount} size="xl" weight="black" />
        </View>
      </Card>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <AppButton
          title="Finalizar Compra"
          onPress={onCheckout}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="bag-check-outline" size={20} color={colors.bg} />}
          accessibilityLabel="Finalizar compra"
        />

        <AppButton
          title="Vaciar carrito"
          onPress={onClear}
          variant="ghost"
          size="sm"
          fullWidth
          accessibilityLabel="Vaciar carrito"
        />
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
  actions: {
    gap: 8,
  },
});
