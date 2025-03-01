// NotificationHandler.js
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
     
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { data } = response.notification.request.content;

      if (data.senderId) {
        navigation.navigate("MessageScreen", {
          senderId: data.senderId,
          recipentId: data.recepientId,
          userName: data.userName
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
