/**
 * Pantalla de Perfil de Usuario
 *
 * Permite visualizar y gestionar el perfil de un único usuario simulado:
 * - Avatar: ver foto actual o avatar por defecto.
 * - Foto de perfil: tomar con la cámara o elegir de la galería (expo-image-picker).
 * - Quitar foto: elimina el archivo local y restablece el avatar.
 * - Edición de nombre: modificar y persistir el nombre (no vacío).
 * - Persistencia completa mediante UserContext y AsyncStorage.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFavorites } from '@/features/favorites/context/FavoritesContext';
import { useUser } from '@/features/profile/context/UserContext';
import { colors } from '@/theme/colors';

export default function Perfil() {
  const { user, isUserLoaded, updateName, updateProfileImage, removeProfileImage } = useUser();
  const { favorites } = useFavorites();

  // ── Estado de edición de nombre ──────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // ── Estado del modal de opciones de fotografía ───────────────────────────
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // ── Manejo de edición de nombre ──────────────────────────────────────────
  const handleStartEditingName = useCallback(() => {
    setNameInput(user.name);
    setNameError(null);
    setIsEditingName(true);
  }, [user.name]);

  const handleCancelEditingName = useCallback(() => {
    setNameInput('');
    setNameError(null);
    setIsEditingName(false);
  }, []);

  const handleSaveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('El nombre no puede estar vacío.');
      return;
    }

    try {
      await updateName(trimmed);
      setIsEditingName(false);
      setNameError(null);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el nuevo nombre.');
    }
  }, [nameInput, updateName]);

  // ── Manejo de Cámara ─────────────────────────────────────────────────────
  const handleTakePhoto = useCallback(async () => {
    setIsPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'Se requiere acceso a la cámara para tomar una foto de perfil.'
        );
        return;
      }

      setIsProcessingImage(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        await updateProfileImage(photoUri);
      }
    } catch (error) {
      console.error('[Perfil] Error al capturar foto con la cámara:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar abrir la cámara.');
    } finally {
      setIsProcessingImage(false);
    }
  }, [updateProfileImage]);

  // ── Manejo de Galería ────────────────────────────────────────────────────
  const handlePickFromGallery = useCallback(async () => {
    setIsPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso denegado',
          'Se requiere acceso a la galería para seleccionar una foto de perfil.'
        );
        return;
      }

      setIsProcessingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        await updateProfileImage(photoUri);
      }
    } catch (error) {
      console.error('[Perfil] Error al seleccionar de la galería:', error);
      Alert.alert('Error', 'Ocurrió un error al abrir la galería.');
    } finally {
      setIsProcessingImage(false);
    }
  }, [updateProfileImage]);

  // ── Quitar fotografía ────────────────────────────────────────────────────
  const handleRemovePhoto = useCallback(async () => {
    setIsPhotoModalVisible(false);
    try {
      setIsProcessingImage(true);
      await removeProfileImage();
    } catch (error) {
      console.error('[Perfil] Error al quitar foto:', error);
      Alert.alert('Error', 'No se pudo quitar la foto de perfil.');
    } finally {
      setIsProcessingImage(false);
    }
  }, [removeProfileImage]);

  // ── Render de carga inicial ──────────────────────────────────────────────
  if (!isUserLoaded) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Cargando datos de perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titleScreen}>Mi Perfil</Text>

        {/* Tarjeta principal del Perfil */}
        <View style={styles.profileCard}>
          {/* Contenedor del Avatar */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setIsPhotoModalVisible(true)}
              style={({ pressed }) => [
                styles.avatarWrapper,
                pressed && styles.avatarPressed,
              ]}
              accessibilityLabel="Opciones de foto de perfil"
              accessibilityRole="button"
            >
              {user.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={56} color={colors.muted} />
                </View>
              )}

              {/* Indicador de carga si la imagen se está procesando */}
              {isProcessingImage && (
                <View style={styles.imageProcessingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}

              {/* Botón flotante para editar foto */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsPhotoModalVisible(true)}
              style={styles.changePhotoBtn}
              hitSlop={8}
            >
              <Text style={styles.changePhotoText}>
                {user.profileImage ? 'Cambiar fotografía' : 'Agregar fotografía'}
              </Text>
            </Pressable>
          </View>

          {/* Sección de Nombre */}
          <View style={styles.nameSection}>
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <Text style={styles.fieldLabel}>Nombre de usuario</Text>
                <TextInput
                  value={nameInput}
                  onChangeText={(val) => {
                    setNameInput(val);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Ingresá tu nombre"
                  placeholderTextColor={colors.muted}
                  style={[styles.nameInput, nameError ? styles.nameInputError : null]}
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}

                <View style={styles.editButtonsRow}>
                  <Pressable
                    onPress={handleCancelEditingName}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveName}
                    style={styles.saveBtn}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.displayInfoContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Pressable
                    onPress={handleStartEditingName}
                    style={styles.editPencilBtn}
                    accessibilityLabel="Editar nombre"
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.teal} />
                  </Pressable>
                </View>


              </View>
            )}
          </View>
        </View>

        {/* Tarjeta de Resumen de Actividad */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumen de Cuenta</Text>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="heart" size={20} color={colors.teal} />
            </View>
            <View style={styles.statDetails}>
              <Text style={styles.statLabel}>Productos en Favoritos</Text>
              <Text style={styles.statValue}>
                {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'} guardados
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.amber} />
            </View>
            <View style={styles.statDetails}>
              <Text style={styles.statLabel}>Estado de sesión</Text>
              <Text style={styles.statValue}>Simulada (sin backend)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Opciones de Fotografía */}
      <Modal
        visible={isPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsPhotoModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Foto de Perfil</Text>

            <Pressable
              style={styles.modalOption}
              onPress={handleTakePhoto}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
                <Ionicons name="camera-outline" size={22} color={colors.teal} />
              </View>
              <Text style={styles.modalOptionText}>Tomar fotografía</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={handlePickFromGallery}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(255, 197, 61, 0.15)' }]}>
                <Ionicons name="images-outline" size={22} color={colors.amber} />
              </View>
              <Text style={styles.modalOptionText}>Elegir de la galería</Text>
            </Pressable>

            {user.profileImage ? (
              <Pressable
                style={styles.modalOption}
                onPress={handleRemovePhoto}
              >
                <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(229, 57, 53, 0.15)' }]}>
                  <Ionicons name="trash-outline" size={22} color="#E53935" />
                </View>
                <Text style={[styles.modalOptionText, { color: '#E53935' }]}>
                  Quitar fotografía
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.modalCancelBtn}
              onPress={() => setIsPhotoModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  loadingPage: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  titleScreen: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 20,
  },

  // ── Tarjeta principal ──────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: colors.bgAlt,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.teal,
  },
  defaultAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E2548',
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgAlt,
  },
  changePhotoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.teal,
  },

  // ── Sección de nombre ──────────────────────────────────────────────────────
  nameSection: {
    width: '100%',
    alignItems: 'center',
  },
  displayInfoContainer: {
    alignItems: 'center',
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  editPencilBtn: {
    padding: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userRoleBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
  userIdText: {
    fontSize: 12,
    color: colors.muted,
  },

  // ── Edición de nombre ──────────────────────────────────────────────────────
  editNameContainer: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  nameInputError: {
    borderColor: '#E53935',
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.teal,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Tarjeta de Resumen ─────────────────────────────────────────────────────
  statsCard: {
    marginTop: 16,
    backgroundColor: colors.bgAlt,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDetails: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },

  // ── Modal de Opciones ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.bgAlt,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  modalOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  modalCancelBtn: {
    marginTop: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
});
