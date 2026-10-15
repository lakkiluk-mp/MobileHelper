import { UpdateBanner } from "@/components/update-banner";
import { RunnerHost } from "@/lib/runner";
import { StudyProvider } from "@/lib/study";
import { colors, fonts } from "@/theme";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_400Regular_Italic } from "@expo-google-fonts/jetbrains-mono/400Regular_Italic";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono/700Bold";
import { SpaceGrotesk_400Regular } from "@expo-google-fonts/space-grotesk/400Regular";
import { SpaceGrotesk_500Medium } from "@expo-google-fonts/space-grotesk/500Medium";
import { SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk/600SemiBold";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk/700Bold";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  const [loaded] = useFonts({
    [fonts.sans]: SpaceGrotesk_400Regular,
    [fonts.sansMedium]: SpaceGrotesk_500Medium,
    [fonts.sansSemibold]: SpaceGrotesk_600SemiBold,
    [fonts.sansBold]: SpaceGrotesk_700Bold,
    [fonts.mono]: JetBrainsMono_400Regular,
    [fonts.monoMedium]: JetBrainsMono_500Medium,
    [fonts.monoBold]: JetBrainsMono_700Bold,
    [fonts.monoItalic]: JetBrainsMono_400Regular_Italic,
  });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  return (
    <StudyProvider>
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        {/* translucent: полоса статуса не рисует свою подложку, шапка уходит под неё. */}
        <StatusBar style="light" translucent />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
        {/* Прогон живёт в невидимом WebView. Его нельзя оставлять во flex-потоке:
            он забирает половину высоты у навигатора, и таб-бар уезжает в середину экрана. */}
        <View pointerEvents="none" style={styles.hostSlot}>
          <RunnerHost />
        </View>
        <UpdateBanner />
      </View>
    </StudyProvider>
  );
}

const styles = StyleSheet.create({
  hostSlot: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
