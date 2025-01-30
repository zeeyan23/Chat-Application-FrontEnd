import { CommonActions, createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
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
import { useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { mainURL } from './Utils/urls';
import AddFriendsToGroup from './screens/AddFriendsToGroup';
import UsersProfileScreen from './screens/UsersProfileScreen';
import UserSettings from './screens/UserSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ForgotPassword from './screens/ForgotPassword';
import { AuthContext, AuthProvider } from './Context/AuthContext';

export const navigationRef = createNavigationContainerRef();

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

 
  
  const AuthenticatedComponents = ({isNewUser})=>{
    return(
      <Stack.Navigator initialRouteName={isNewUser ? "Home" : "Chats"}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chats" component={ChatScreen} options={{ headerShown: true }} />
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

  function AuthStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }
  
  function Navigation() {
    const { isAuthenticated, isNewUser } = useContext(AuthContext);
    useEffect(() => {
      if (isAuthenticated && navigationRef.isReady()) {
        setTimeout(() => {
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Chats' }],
            })
          );
        }, 300); // Increased delay to 300ms
      }
    }, [isAuthenticated]);
    
    return (
      <NavigationContainer ref={navigationRef}>
        {isAuthenticated ? <AuthenticatedComponents isNewUser={isNewUser}/> : <AuthStack/>}
        <NotificationHandler />
      </NavigationContainer>
    );
  }
  
  return (
    <AuthProvider>
      <UserContext>
        <NativeBaseProvider>
          <Navigation />
        </NativeBaseProvider>
      </UserContext>
    </AuthProvider>
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
