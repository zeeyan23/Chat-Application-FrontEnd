import * as React from "react";
import { Box, Text, Heading, VStack, FormControl, Input, Link, Button, HStack, Center, NativeBaseProvider } from "native-base";
import { Platform, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

function LoginScreen(){

    const [formData, setData] = useState({});
    const [expoPushToken, setExpoPushToken] = useState('');

    const navigation = useNavigation();

    useEffect(()=>{
        const isLoggenIn = async()=>{
            try {
                const token = await AsyncStorage.getItem("authToken");

                if(token){
                    navigation.navigate("Home");
                }else {

                }
            } catch (error) {
                console.log("error", error)
            }
        }

        isLoggenIn();
    },[]);

    // Set up notification handler
    Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
    });

    // Helper function to handle push token generation
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


    // async function SignInHandler() {
    //     let expoPushToken = null;
    //     try {
    //         expoPushToken = await registerForPushNotificationsAsync();
    //     } catch (error) {
    //         console.log('Error during push token registration:', error);
    //     }

    //     console.log('Expo Push Token (from login):', expoPushToken);

    //     setData((prevData) => ({
    //         ...prevData, 
    //         expoPushToken : expoPushToken,
    //     }));
    //     try {
    //         const response = await axios.post(
    //             `${mainURL}/user_login/`,
    //             { ...formData, expoPushToken },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 }
    //             }
    //         ).then((response)=>{
    //             console.log(response.status)
    //             const token = response.data.token;
    //             AsyncStorage.setItem("authToken", token);
    //             navigation.navigate('Home');
    //         });

            
    //     } catch (error) {
    //         console.log('Error:', error); // Log error details
    //         if (error.response) {
    //             console.log('Server Error:', error.response.data); // Server-side error
    //         } else if (error.request) {
    //             console.log('Network Error:', error.request); // Network-related issue
    //         } else {
    //             console.log('Other Error:', error.message); // Any other error
    //         }
    //     }
    // }

    async function SignInHandler() {
        let expoPushToken = null;
    
        try {
            expoPushToken = await registerForPushNotificationsAsync();
        } catch (error) {
            console.log('Error during push token registration:', error);
        }
    
        console.log('Expo Push Token (from login):', expoPushToken);
    
        setData((prevData) => ({
            ...prevData, 
            expoPushToken: expoPushToken,
        }));
    
        try {
            const response = await axios.post(
                `${mainURL}/user_login/`,
                { ...formData, expoPushToken: expoPushToken || 'null' }, // Handle null tokens gracefully
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
    
            console.log(response.status);
            const token = response.data.token;
            await AsyncStorage.setItem("authToken", token); // Ensure async storage is awaited
            navigation.navigate('Home');
        } catch (error) {
            console.log('Error:', error); // Log error details
            if (error.response) {
                console.log('Server Error:', error.response.data); // Server-side error
            } else if (error.request) {
                console.log('Network Error:', error.request); // Network-related issue
            } else {
                console.log('Other Error:', error.message); // Any other error
            }
        }
    }
    
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
                    <Input type="password" onChangeText={changePasswordHandler}/>
                    <Link _text={{
                    fontSize: "xs",
                    fontWeight: "500",
                    color: "indigo.500"
                }} alignSelf="flex-end" mt="1">
                    Forget Password?
                    </Link>
                </FormControl>
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