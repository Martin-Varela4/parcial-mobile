import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { STORAGE_KEYS } from '@/services/storage/keys';
import { DEFAULT_USER, UserProfile } from '../types/user.types';

export const userStorage = {
  /**
   * Obtiene los datos del perfil persistidos en AsyncStorage.
   * Si no existen o hay un error, retorna los datos por defecto (Usuario Demo).
   */
  async getUser(): Promise<UserProfile> {
    try {
      console.log('[UserStorage] Iniciando lectura con clave:', STORAGE_KEYS.USER_PROFILE);
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!raw) {
        console.log('[UserStorage] No se encontró perfil previo, retornando usuario por defecto.');
        return { ...DEFAULT_USER };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        console.warn('[UserStorage] Datos de perfil corruptos en storage, usando por defecto:', parsed);
        return { ...DEFAULT_USER };
      }

      const name = typeof parsed.name === 'string' && parsed.name.trim().length > 0
        ? parsed.name.trim()
        : DEFAULT_USER.name;

      let profileImage: string | null = null;
      if (typeof parsed.profileImage === 'string' && parsed.profileImage.length > 0) {
        // Verificar si el archivo físico aún existe en el dispositivo
        try {
          const info = await FileSystem.getInfoAsync(parsed.profileImage);
          if (info.exists) {
            profileImage = parsed.profileImage;
          } else {
            console.warn('[UserStorage] El archivo de imagen ya no existe en disco:', parsed.profileImage);
          }
        } catch {
          // Si getInfoAsync falla (ej. URI web o error de filesystem), conservamos o descartamos con seguridad
          profileImage = parsed.profileImage;
        }
      }

      const user: UserProfile = {
        id: parsed.id ?? DEFAULT_USER.id,
        name,
        profileImage,
      };

      console.log('[UserStorage] Perfil recuperado con éxito:', user.name);
      return user;
    } catch (error) {
      console.error('[UserStorage] Error al leer perfil de AsyncStorage:', error);
      return { ...DEFAULT_USER };
    }
  },

  /**
   * Guarda los datos del perfil en AsyncStorage (ID, nombre y URI local de la imagen).
   * Nunca almacena Base64.
   */
  async saveUser(user: UserProfile): Promise<void> {
    try {
      console.log('[UserStorage] Guardando perfil en:', STORAGE_KEYS.USER_PROFILE, user.name);
      const payload: UserProfile = {
        id: user.id,
        name: user.name.trim(),
        profileImage: user.profileImage,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(payload));
      console.log('[UserStorage] Perfil guardado con éxito en AsyncStorage.');
    } catch (error) {
      console.error('[UserStorage] Error al guardar perfil en AsyncStorage:', error);
      throw error;
    }
  },

  /**
   * Copia una imagen seleccionada (desde cámara o galería) al directorio de documentos
   * persistente de la app, y elimina el archivo anterior si pertenecía a este perfil.
   * Retorna la nueva URI local persistente.
   */
  async saveProfileImageFile(sourceUri: string, previousUri?: string | null): Promise<string> {
    try {
      console.log('[UserStorage] Persistiendo imagen desde:', sourceUri);

      // Si no hay documentDirectory (ej. en web), usamos directamente la URI
      if (!FileSystem.documentDirectory) {
        console.log('[UserStorage] FileSystem.documentDirectory no disponible, usando sourceUri directa.');
        return sourceUri;
      }

      // Generar nombre único con timestamp para evitar problemas de caché de imagen
      const fileExtension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
      const targetFileName = `profile_avatar_${Date.now()}.${fileExtension}`;
      const targetUri = `${FileSystem.documentDirectory}${targetFileName}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });

      console.log('[UserStorage] Imagen copiada exitosamente a:', targetUri);

      // Limpiar la imagen anterior para no acumular basura en el almacenamiento
      if (previousUri && previousUri !== targetUri) {
        await this.deleteProfileImageFile(previousUri);
      }

      return targetUri;
    } catch (error) {
      console.error('[UserStorage] Error al persistir archivo de imagen:', error);
      throw error;
    }
  },

  /**
   * Elimina un archivo de imagen de perfil del almacenamiento local si pertenece
   * al directorio de documentos de la aplicación.
   */
  async deleteProfileImageFile(imageUri?: string | null): Promise<void> {
    if (!imageUri || typeof imageUri !== 'string') return;

    try {
      // Verificar que el archivo pertenezca al documentDirectory de la app antes de borrar
      if (FileSystem.documentDirectory && imageUri.startsWith(FileSystem.documentDirectory)) {
        console.log('[UserStorage] Eliminando archivo anterior:', imageUri);
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
        console.log('[UserStorage] Archivo eliminado con éxito.');
      }
    } catch (error) {
      console.warn('[UserStorage] No se pudo eliminar el archivo de imagen anterior:', error);
    }
  },
};
