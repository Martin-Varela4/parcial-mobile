import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FavoritesProvider } from '@/features/favorites/context/FavoritesContext';

export default function RootLayout() {
  return (
    // GestureHandlerRootView es requerido por react-native-gesture-handler
    // para que los gestos funcionen en toda la aplicación.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FavoritesProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </FavoritesProvider>
    </GestureHandlerRootView>
  );
}