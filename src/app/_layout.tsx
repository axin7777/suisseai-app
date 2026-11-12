import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { supabase } from "../lib/supabase";

function isRecoveryLink() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.location?.hash && window.location.hash.includes("type=recovery");
}

const publicPages = ["login", "privacy", "terms"];

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

let rcConfigured = false;

export default function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
      const key = Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
      if (key) {
        try {
          Purchases.configure({ apiKey: key });
          rcConfigured = true;
        } catch (e) {
          console.warn("RevenueCat configure hatası:", e);
        }
      } else {
        console.warn("RevenueCat API anahtarı tanımlı değil (EXPO_PUBLIC_REVENUECAT_IOS_KEY).");
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/login");
      }
    });
    if (isRecoveryLink()) {
      router.replace("/login");
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  // RevenueCat'in app_user_id'sini Supabase auth user id ile eşle, böylece
  // RevenueCat webhook'u abonelik durumunu doğru kullanıcıya yazabiliyor.
  useEffect(() => {
    if (!rcConfigured) return;
    if (session?.user?.id) {
      Purchases.logIn(session.user.id).catch(() => {});
    } else {
      Purchases.logOut().catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!ready) return;
    const onPublicPage = publicPages.includes(segments[0] as string);
    const onLogin = segments[0] === "login";
    if (isRecoveryLink()) return;
    if (!session && !onPublicPage) router.replace("/login");
    if (session && onLogin) router.replace("/");
  }, [session, ready, segments]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "bottom"]}>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 80, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Fehler</Text>
      <Text selectable>{String(error?.stack || error?.message || error).slice(0, 1200)}</Text>
    </View>
  );
}
