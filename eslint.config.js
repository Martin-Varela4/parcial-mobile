// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  /**
   * react-native-reanimated utiliza mutaciones de SharedValue (ej. sharedValue.value = ...)
   * en worklets del UI Thread. El analizador de inmutabilidad estricto del React Compiler
   * trata cualquier argumento o hook como inmutable y no distingue los SharedValues.
   * Se deshabilita únicamente la regla de inmutabilidad en los archivos de animación.
   * Las reglas 'react-hooks/refs' y 'react-hooks/set-state-in-effect' se mantienen activas.
   *
   * Ref: https://react.dev/learn/react-compiler#using-react-compiler-with-libraries
   */
  {
    files: [
      "src/app/(tabs)/favoritos.tsx",
    ],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);
