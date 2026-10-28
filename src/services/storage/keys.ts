/**
 * Convención centralizada para claves de almacenamiento local (AsyncStorage).
 *
 * Guía de arquitectura de almacenamiento:
 * - AsyncStorage: Para datos pequeños, no sensibles y de estado de la aplicación (ej. IDs de favoritos, preferencias de UI).
 * - SecureStore (futuro): Para información confidencial o sensible (ej. tokens JWT de autenticación, credenciales).
 * - FileSystem (futuro): Para archivos binarios, fotos y documentos (guardando únicamente las rutas URI en base de datos o AsyncStorage).
 */
export const STORAGE_KEYS = {
  FAVORITES: '@mi-ecommerce/favorites:v1',
  USER_PROFILE: '@mi-ecommerce/profile:v1',
  USER_PREFERENCES: '@mi-ecommerce/preferences:v1',
} as const;
