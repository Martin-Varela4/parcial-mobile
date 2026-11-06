import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FavoritesProvider } from '@/features/favorites/context/FavoritesContext';
import { UserProvider } from '@/features/profile/context/UserContext';

export default function RootLayout() {
  return (
    // GestureHandlerRootView es requerido por react-native-gesture-handler
    // para que los gestos funcionen en toda la aplicación.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <FavoritesProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </FavoritesProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
