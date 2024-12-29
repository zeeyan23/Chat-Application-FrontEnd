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


export default function App() {

  const Stack= createStackNavigator();
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


  
  return (
    <UserContext>
      <NativeBaseProvider>
        <NavigationContainer>
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
          </Stack.Navigator>
          <NotificationHandler />
        </NavigationContainer>
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
