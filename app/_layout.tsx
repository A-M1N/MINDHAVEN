import { useFonts } from "expo-font";
import { Stack } from "expo-router";

export default function RootLayout() {
  useFonts({
    NotoSans: require("./../assets/fonts/NotoSansKR-VariableFont_wght.ttf"),
  });
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    ></Stack>
  );
}
