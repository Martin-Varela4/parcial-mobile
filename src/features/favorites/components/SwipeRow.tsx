/**
 * SwipeRow — Fila deslizable basada en ReanimatedSwipeable (Gestos.pdf, Diapositiva 8).
 *
 * Expone la acción de eliminar revelando el botón «Eliminar» al deslizar hacia la izquierda.
 * Al presionar el botón se ejecuta `onDelete`, que abrirá la confirmación con Alert.alert().
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';

interface SwipeRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeRow({ children, onDelete }: SwipeRowProps) {
  return (
    <Swipeable
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Eliminar producto de favoritos"
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>
      )}
      containerStyle={styles.container}
      childrenContainerStyle={styles.childrenContainer}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  childrenContainer: {
    flex: 1,
    width: '100%',
  },
  deleteButton: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    gap: 4,
    borderRadius: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
