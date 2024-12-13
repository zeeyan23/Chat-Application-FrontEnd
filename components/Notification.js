// NotificationHandler.js
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Foreground notification listener
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listener for when a notification is clicked
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;
      console.log("Notification clicked with data:", data);

      // Navigate to the chat screen with senderId
      if (data.senderId) {
        navigation.navigate("MessageScreen", {
          senderId: data.senderId,
          recepientId: data.recepientId,
        });
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, [navigation]);

  return null;
};

export default NotificationHandler;
