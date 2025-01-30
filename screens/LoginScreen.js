import * as React from "react";
import { Box, Text, Heading, VStack, FormControl, Input, Link, Button, HStack, Center, NativeBaseProvider, Pressable, Icon } from "native-base";
import { Platform, StyleSheet } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Ionicons } from "@expo/vector-icons";
import { navigationRef } from "../App";
import { AuthContext } from "../Context/AuthContext";
import { useContext } from "react";

function LoginScreen(){

    const [formData, setData] = useState({});
    const [expoPushToken, setExpoPushToken] = useState('');
    const [isLoading, setIsLoading] = useState(true); 
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { signIn } = useContext(AuthContext);
    const navigation = useNavigation();

    // useEffect(() => {
    //     const isLoggedIn = async () => {

    //         try {
    //             const token = await AsyncStorage.getItem("authToken");
    //             if (token) {
    //                 const response = await axios.get(`${mainURL}/get-user-id-from-token`, {
    //                     headers: { Authorization: `Bearer ${token}` }
    //                 });
    //                 const userId = response.data.userId;
    //                 const friendResponse = await axios.get(`${mainURL}/has-friends/${userId}`);
    //                 if (friendResponse.data.exists) {
    //                     navigation.navigate("Chats");
    //                 } else {
    //                     navigation.navigate("Home");
    //                 }
    //             }
    //         } catch (error) {
    //             console.log("error", error);
    //         }
    //     };
    
    //     isLoggedIn();
    // }, []);
    
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
        if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted to get push token for push notification!');
            return null;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found');
            return null;
        }

        try {
        const pushToken = (
            await Notifications.getExpoPushTokenAsync({
            projectId,
            })
        ).data;
        console.log('Expo Push Token:', pushToken);
        return pushToken;
        } catch (error) {
        console.log('Error fetching Expo Push Token:', error);
        return null;
        }
    } else {
        console.log('Must use physical device for push notifications');
        return null;
    }
    }

    function changeEmailHandler(enteredValue){
        setData({ ...formData, email: enteredValue });
    }

    function changePasswordHandler(enteredValue){
        setData({ ...formData, password: enteredValue });
    }

    function handleSignUpClick () {
        navigation.navigate('Register'); 
    };

    async function SignInHandler() {
        let expoPushToken = null;
    
        try {
            expoPushToken = await registerForPushNotificationsAsync();
        } catch (error) {
            console.log('Error during push token registration:', error);
        }

        setData((prevData) => ({
            ...prevData, 
            expoPushToken: expoPushToken,
        }));
    
        try {
            const response = await axios.post(
                `${mainURL}/user_login/`,
                { ...formData, expoPushToken: expoPushToken || 'null' }, 
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
    
            console.log(response.data)
            const token = response.data.token;
            await AsyncStorage.setItem("authToken", token); 
            signIn();
            setTimeout(() => {
                if (navigationRef.isReady()) {
                  navigationRef.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: response.data.hasValidFriends || response.data.hasValidGroups ? 'Chats' : 'Home' }],
                    })
                  );
                }
              }, 300);
            // if(response.data.hasValidFriends || response.data.hasValidGroups){
            //     //navigation.navigate('Chats');
            //     if (navigationRef.isReady()) {
            //         navigationRef.dispatch(
            //           CommonActions.reset({
            //             index: 0,
            //             routes: [{ name: 'Chats' }], // Ensure 'Chats' exists in your stack
            //           })
            //         );
            //       }
                
            // }else{
            //     if (navigationRef.isReady()) {
            //         navigationRef.dispatch(
            //           CommonActions.reset({
            //             index: 0,
            //             routes: [{ name: 'Home' }], // Ensure 'Chats' exists in your stack
            //           })
            //         );
            //       }
            // }
            
        } catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    setErrorMessage("User not found");
                } else if(error.response.data && error.response.data.message){
                    setErrorMessage("Failed to login. Please try again.");
                }
            } else {
                setErrorMessage("Network error. Please check your connection.");
            }
        }
    }
    
    // if (isLoading) {
    //     return (
    //         <Center w="100%" style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    //             <Heading>Loading...</Heading>
    //         </Center>
    //     );
    // }

    return(
        <Center w="100%" style={styles.container}>
            <Box safeArea p="2" py="8" w="90%" maxW="290">
                <Heading size="lg" fontWeight="600" color="coolGray.800" _dark={{
                color: "warmGray.50"
            }}>
                Welcome
                </Heading>
                <Heading mt="1" _dark={{
                color: "warmGray.200"
            }} color="coolGray.600" fontWeight="medium" size="xs">
                Sign in to continue!
                </Heading>

                <VStack space={3} mt="5">
                <FormControl>
                    <FormControl.Label>Email ID</FormControl.Label>
                    <Input onChangeText={changeEmailHandler}/>
                </FormControl>
                <FormControl>
                    <FormControl.Label>Password</FormControl.Label>
                    <Input type={showPassword ? "text" : "password"}  onChangeText={changePasswordHandler} InputRightElement={
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Icon
                            as={<Ionicons name={showPassword ? "eye-off" : "eye"} />}
                            size={5}
                            mr="2"
                            color="muted.400"
                            />
                        </Pressable>
                        }/>
                    <Link _text={{
                        fontSize: "xs",
                        fontWeight: "500",
                        color: "indigo.500"
                    }} alignSelf="flex-end" mt="1" onPress={() => navigation.navigate('ForgotPassword')}>
                    Forget Password?
                    </Link>
                </FormControl>
                {errorMessage && <Text color="red.500" fontSize="xs">{errorMessage}</Text>}
                <Button mt="2" colorScheme="indigo" onPress={SignInHandler}>
                    Sign in
                </Button>
                <HStack mt="6" justifyContent="center">
                    <Text fontSize="sm" color="coolGray.600" _dark={{
                    color: "warmGray.200"
                }}>
                    I'm a new user.{" "}
                    </Text>
                    <Link _text={{
                    color: "indigo.500",
                    fontWeight: "medium",
                    fontSize: "sm"
                }} onPress={handleSignUpClick}>
                    Sign Up
                    </Link>
                </HStack>
                </VStack>
            </Box>
        </Center>
    )
}

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }
});

export default LoginScreen;