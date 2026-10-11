import { useStudy } from "@/lib/study";
import { streak } from "@etalon/web-stats";
import { colors, fonts } from "@/theme";
import { Flame } from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "./text";

export function StreakChip() {
  const { progress } = useStudy();
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    setDays(streak(progress, new Date()));
  }, [progress]);
  return (
    <View style={styles.chip} accessibilityLabel={days === null ? "Серия" : `Серия: ${days} дн.`}>
      <Flame size={16} color={colors.warn} />
      <T mono size={13} weight="bold" color={colors.warn}>
        {days ?? "–"}
      </T>
    </View>
  );
}

export function TopBar({ title }: { title?: string }) {
  return (
    <View style={styles.top}>
      {title ? (
        <T size={28} weight="semibold">
          {title}
        </T>
      ) : (
        <T mono size={17} weight="bold">
          эталон
          <T mono size={17} weight="bold" color={colors.mark}>
            _
          </T>
        </T>
      )}
      <StreakChip />
    </View>
  );
}

const TAB_BUTTON = 48;
const TAB_BAR_PAD = 6;
const TAB_BAR_HEIGHT = TAB_BUTTON + TAB_BAR_PAD * 2 + 2;
const TAB_BAR_AIR = 24;

export function useTabBarBottom() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 16);
}

export function useTabBarInset() {
  return useTabBarBottom() + TAB_BAR_HEIGHT + TAB_BAR_AIR;
}

/**
 * Шапка — отдельный слой над скроллом: «эталон_» и огонёк остаются на месте,
 * уезжает только содержимое экрана.
 */
export function Screen({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 20) }]}>
      {header}
      {children}
    </View>
  );
}

export function SyncNote() {
  const { note, offline } = useStudy();
  return (
    <T
      size={14}
      color={offline ? colors.ink : colors.muted}
      style={offline ? styles.noteOff : styles.note}
    >
      {note}
    </T>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
  },
  top: {
    marginBottom: 16,
    marginHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    backgroundColor: colors.raised,
    paddingHorizontal: 10,
  },
  note: { marginTop: 24 },
  noteOff: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: colors.markSoft,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: "hidden",
  },
});

export const tabBarStyle = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(30, 35, 44, 0.95)",
    padding: TAB_BAR_PAD,
  },
  active: {
    height: TAB_BUTTON,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 22,
    backgroundColor: colors.mark,
    paddingHorizontal: 16,
  },
  idle: {
    height: TAB_BUTTON,
    flex: 1,
    minWidth: 44,
    maxWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.paper,
  },
});
