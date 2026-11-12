import { Alert } from "react-native";

try {
  const EU = globalThis.ErrorUtils;
  if (EU && EU.setGlobalHandler) {
    EU.setGlobalHandler((error, isFatal) => {
      try {
        const msg = String((error && (error.stack || error.message)) || error).slice(0, 700);
        Alert.alert(isFatal ? "Fataler Fehler" : "Fehler", msg);
      } catch (e) {}
    });
  }
} catch (e) {}

import "expo-router/entry";
