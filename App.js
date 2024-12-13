import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { NativeBaseProvider } from 'native-base';
import HomeScreen from './screens/HomeScreen';
import { UserContext } from './Context/UserContext';
import FriendsScreen from './screens/FriendsScreen';
import ChatScreen from './screens/ChatScreen';
import MessageScreen from './screens/MessageScreen';
import NotificationHandler from './components/Notification';

export default function App() {

  const Stack= createNativeStackNavigator();

  return (
    <UserContext>
      <NativeBaseProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}}/>
            <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}}/>
            <Stack.Screen name="Home" component={HomeScreen}/>
            <Stack.Screen name="FriendRequests" component={FriendsScreen} options={{
              title: 'Friend Requests',
            }}/>
            <Stack.Screen name="Chats" component={ChatScreen}/>
            <Stack.Screen name="MessageScreen" component={MessageScreen}/>
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
