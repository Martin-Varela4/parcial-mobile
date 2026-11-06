// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  /**
   * Las reglas del React Compiler (react-hooks/refs, react-hooks/immutability,
   * react-hooks/set-state-in-effect) son incompatibles con los patrones de uso
   * estándar de react-native-reanimated (SharedValue.value = ...) y
   * react-native-gesture-handler cuando se inicializan gestos en el cuerpo del
   * componente. Se desactivan solo en los archivos que usan animaciones.
   *
   * Ref: https://react.dev/learn/react-compiler#using-react-compiler-with-libraries
   */
  {
    files: [
      "src/app/(tabs)/favoritos.tsx",
      "src/features/favorites/components/SwipeableFavoriteCard.tsx",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
