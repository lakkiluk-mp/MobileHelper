import { PathView } from "@/components/path-view";
import { Screen, SyncNote, TopBar, useTabBarInset } from "@/components/shell";
import { ScrollView } from "react-native";

export default function Home() {
  const bottom = useTabBarInset();
  return (
    <Screen header={<TopBar />}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <PathView />
        <SyncNote />
      </ScrollView>
    </Screen>
  );
}
