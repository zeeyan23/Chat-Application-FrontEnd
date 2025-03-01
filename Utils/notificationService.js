import * as Notifications from 'expo-notifications';

export async function sendCallNotification(data) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Incoming call from ${data.callerInfo.user_name}`,
      body: 'Tap to accept or decline.',
      data: { ...data },
    },
    trigger: null, // Immediate notification
  });
}
