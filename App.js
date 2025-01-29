import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { NativeBaseProvider } from 'native-base';
import HomeScreen from './screens/HomeScreen';
import { UserContext } from './Context/UserContext';
import FriendsScreen from './screens/FriendsScreen';
import ChatScreen from './screens/ChatScreen';
import MessageScreen from './screens/MessageScreen';
import NotificationHandler from './components/Notification';
import ForwardMessagesScreen from './screens/ForwardMessagesScreen';
import StarredMessagesScreen from './screens/StarredMessagesScreen';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { mainURL } from './Utils/urls';
import AddFriendsToGroup from './screens/AddFriendsToGroup';
import UsersProfileScreen from './screens/UsersProfileScreen';
import UserSettings from './screens/UserSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ForgotPassword from './screens/ForgotPassword';


export default function App() {

  const Stack= createStackNavigator();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser]=useState(false);

  useEffect(() => {
    const socket = io(mainURL);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to fetch auth token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthToken();
  }, []); 

  useEffect(() => {
    const isLoggedIn = async () => {

        try {
            const token = await AsyncStorage.getItem("authToken");
            if (token) {
                const response = await axios.get(`${mainURL}/get-user-id-from-token`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userId = response.data.userId;
                const friendResponse = await axios.get(`${mainURL}/has-friends/${userId}`);
                if (friendResponse.data.exists) {
                    setIsNewUser(false);
                } else {
                    setIsNewUser(true);
                }
            }
        } catch (error) {
            console.log("error", error);
        }
    };

    isLoggedIn();
  }, []);

  function AuthenticatedComponents(){
    return(
      <Stack.Navigator>
        {isNewUser ? <Stack.Screen name="Home" component={HomeScreen} /> : <Stack.Screen name="Chats" component={ChatScreen} options={{ headerShown: true }} />}
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}}/>
        
        <Stack.Screen name="FriendRequests" component={FriendsScreen} options={{
          title: 'Friend Requests',
        }}/>
        
        <Stack.Screen name="MessageScreen" component={MessageScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="MessageForwardScreen" component={ForwardMessagesScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="StarredMessageScreen" component={StarredMessagesScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="AddFriendsToGroup" component={AddFriendsToGroup}  options={{ headerShown: true }}/>
        <Stack.Screen name="UsersProfileScreen" component={UsersProfileScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Settings" component={UserSettings}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{headerShown: false}}/>
      </Stack.Navigator>

    )
  }

  function AuthStack(){
    return(
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}}/>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FriendRequests" component={FriendsScreen} options={{
          title: 'Friend Requests',
        }}/>
        <Stack.Screen name="Chats" component={ChatScreen} options={{ headerShown: true }} />
        <Stack.Screen name="MessageScreen" component={MessageScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="MessageForwardScreen" component={ForwardMessagesScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="StarredMessageScreen" component={StarredMessagesScreen}  options={{ headerShown: true }}/>
        <Stack.Screen name="AddFriendsToGroup" component={AddFriendsToGroup}  options={{ headerShown: true }}/>
        <Stack.Screen name="UsersProfileScreen" component={UsersProfileScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Settings" component={UserSettings}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{headerShown: false}}/>
      </Stack.Navigator>

    )
  }
  function Navigation() {
    return (
      <NavigationContainer>
        {isAuthenticated ? <AuthenticatedComponents /> : <AuthStack/>}
        <NotificationHandler />
      </NavigationContainer>
    );
  }
  
  return (
    <UserContext>
      <NativeBaseProvider>
        <Navigation />
      </NativeBaseProvider>
    </UserContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
