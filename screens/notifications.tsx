import { useRoute } from "@react-navigation/native";
import { View, Text } from "react-native";
export default function NotificationsScreen() {
  const route = useRoute();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{JSON.stringify(route.params)}</Text>
    </View>
  );
}
