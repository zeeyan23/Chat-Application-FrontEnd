import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { NativeBaseProvider } from "native-base";
import HomeScreen from "./screens/HomeScreen";
import { UserContext, UserType } from "./Context/UserContext";
import FriendsScreen from "./screens/FriendsScreen";
import ChatScreen from "./screens/ChatScreen";
import MessageScreen from "./screens/MessageScreen";
import NotificationHandler from "./components/Notification";
import ForwardMessagesScreen from "./screens/ForwardMessagesScreen";
import StarredMessagesScreen from "./screens/StarredMessagesScreen";
import { useContext, useEffect, useState } from "react";
import AddFriendsToGroup from "./screens/AddFriendsToGroup";
import UsersProfileScreen from "./screens/UsersProfileScreen";
import UserSettings from "./screens/UserSettings";
import ForgotPassword from "./screens/ForgotPassword";
import { AuthContext, AuthProvider } from "./Context/AuthContext";
import CallScreen from "./screens/CallScreen";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import VideoScreen from "./screens/VideoScreen";
import VideoCallScreen from "./screens/VideoCallScreen";
import VoiceScreen from "./screens/VoiceScreen";
import VoiceCallScreen from "./screens/VoiceCallScreen";
import socketInstance from "./Utils/socket";
import CustomSplashScreen from "./screens/CustomSplashScreen";
import DisappearingMessages from "./screens/DisappearingMessages";

export const navigationRef = createNavigationContainerRef();
const firebaseConfig = {
  apiKey: "AIzaSyDNMObk5i4DCZE8hm7CU4PeYAs9j3PkbFM",
  //authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "real-time-chat-app-89425",
  storageBucket: "real-time-chat-app-89425.firebasestorage.app",
  //messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:844526207661:android:3f188c4649487fb74a3c24",
};

const app = initializeApp(firebaseConfig);

// Ensure Firebase Auth is initialized properly
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const Stack = createStackNavigator();
export default function App() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  useEffect(() => {
    async function getPermission() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }
    getPermission();
  }, []);
  const AuthenticatedComponents = ({ isNewUser }) => {
    return (
      <Stack.Navigator initialRouteName={isNewUser ? "Home" : "Chats"}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            headerTintColor: "white",
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="Chats"
          component={ChatScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            headerTintColor: "white",
            animation: "fade",
            // presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}}/> */}

        <Stack.Screen
          name="FriendRequests"
          component={FriendsScreen}
          options={{
            title: "Friend Requests",
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            headerTintColor: "white",
            animation: "fade",
            presentation: "transparentModal",
          }}
        />

        <Stack.Screen
          name="MessageScreen"
          component={MessageScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            animation: "fade",
            //  presentation: "transparentModal",
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="MessageForwardScreen"
          component={ForwardMessagesScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            headerTintColor: "white",
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="StarredMessageScreen"
          component={StarredMessagesScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            animation: "fade",
            presentation: "transparentModal",
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="AddFriendsToGroup"
          component={AddFriendsToGroup}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            animation: "fade",
            presentation: "transparentModal",
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="UsersProfileScreen"
          component={UsersProfileScreen}
          options={{
            headerShown: false,
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="Settings"
          component={UserSettings}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            animation: "fade",
            presentation: "transparentModal",
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="Disappearing Messages"
          component={DisappearingMessages}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "black",
              borderBottomWidth: 1,
              borderBottomColor: "white",
            },
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CallScreen"
          component={CallScreen}
          options={{ animation: "fade", presentation: "card" }}
        />
        <Stack.Screen
          name="VideoScreen"
          component={VideoScreen}
          options={{
            headerShown: false,
            animation: "fade",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="VideoCallScreen"
          component={VideoCallScreen}
          options={{
            headerShown: false,
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="VoiceScreen"
          component={VoiceScreen}
          options={{
            headerShown: false,
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="VoiceCallScreen"
          component={VoiceCallScreen}
          options={{
            headerShown: false,
            animation: "fade",
            presentation: "transparentModal",
          }}
        />
      </Stack.Navigator>
    );
  };
  function AuthStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }
  function Navigation() {
    const { isAuthenticated, isNewUser } = useContext(AuthContext);
    const { userId, setUserId } = useContext(UserType);

    useEffect(() => {
      if (isAuthenticated && userId) {
        socketInstance.joinRoom(userId); // Ensure user joins their room
        console.log(`✅ Joined socket room: ${userId}`);
      }
    }, [isAuthenticated, userId]);

    useEffect(() => {
      if (isAuthenticated && navigationRef.isReady()) {
        setTimeout(() => {
          if (!isNewUser) {
            navigationRef.navigate("Chats");
          } else {
            navigationRef.navigate("Home");
          }
        }, 300);
      }
    }, [isAuthenticated, isNewUser]);

    useEffect(() => {
      const subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const { screen, callerId, calleeId, isCaller, isGroup } =
            response.notification.request.content.data;
          if (screen === "VoiceScreen" && navigationRef.isReady()) {
            navigationRef.navigate("VoiceScreen", {
              callerId,
              calleeId,
              isCaller,
              isGroup,
            });
          }
        });

      // Cleanup on unmount
      return () => subscription.remove();
    }, []);

    if (!isSplashFinished) {
      return <CustomSplashScreen onFinish={() => setIsSplashFinished(true)} />;
    }

    return (
      <NavigationContainer
        linking={{
          prefixes: [Linking.createURL("/")],
          config: {
            screens: {
              Home: "home",
              Chats: "chats",
              CallScreen: "call/:callerId/:calleeId",
            },
          },
          async getInitialURL() {
            const url = await Linking.getInitialURL();
            if (url != null) {
              return url;
            }
            const response =
              await Notifications.getLastNotificationResponseAsync();
            if (response) {
              const { screen, callerId, calleeId } =
                response.notification.request.content.data;
              if (screen === "CallScreen") {
                return Linking.createURL(`/call/${callerId}/${calleeId}`);
              }
            }
            return null;
          },
          subscribe(listener) {
            const onReceiveURL = ({ url }) => {
              listener(url);
            };

            const eventListenerSubscription = Linking.addEventListener(
              "url",
              onReceiveURL
            );

            const subscription =
              Notifications.addNotificationResponseReceivedListener(
                (response) => {
                  const { screen, callerId, calleeId } =
                    response.notification.request.content.data;
                  if (screen === "CallScreen") {
                    listener(
                      Linking.createURL(`/call/${callerId}/${calleeId}`)
                    );
                  }
                }
              );

            return () => {
              eventListenerSubscription.remove();
              subscription.remove();
            };
          },
        }}
        ref={navigationRef}
      >
        {isAuthenticated ? (
          <AuthenticatedComponents isNewUser={isNewUser} />
        ) : (
          <AuthStack />
        )}
        <NotificationHandler />
      </NavigationContainer>
    );
  }
  return (
    <AuthProvider>
      <UserContext>
        <NativeBaseProvider>
          <StatusBar style="light" hidden={false} />
          <Navigation />
        </NativeBaseProvider>
      </UserContext>
    </AuthProvider>
  );
}
