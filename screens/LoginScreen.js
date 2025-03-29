import { Box, Text, Heading, VStack, FormControl, Input, Center, Pressable, Icon, Avatar, Spinner } from "native-base";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../Context/AuthContext";
import { useContext } from "react";
import { LinearGradient } from 'expo-linear-gradient';

function LoginScreen(){

    const [formData, setData] = useState({});
    const [expoPushToken, setExpoPushToken] = useState('');
    const [isLoading, setIsLoading] = useState(true); 
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { signIn } = useContext(AuthContext);
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
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
                `${mainURL}/user/user_login/`,
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
            const isNewUser = !(response.data.hasValidFriends);
            setLoading(false);
            signIn(isNewUser);
            
            // setTimeout(() => {
            //     if (navigationRef.isReady()) {
            //         if(response.data.hasValidFriends === true || response.data.hasValidGroups === true){
            //             navigation.navigate('Chats');
            //         }else {
            //             navigation.navigate('Home');
            //         }
            //     }
            //   }, 300);
            
        } catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    setErrorMessage("User not found");
                    setLoading(false);
                } else if(error.response.data && error.response.data.message){
                    setErrorMessage("Failed to login. Please try again.");
                    setLoading(false);
                }
            } else {
                setErrorMessage("Network error. Please check your connection.");
                setLoading(false);
            }
        }
    }
    

    return(
        <Center w="100%" style={styles.container}>
            <Box safeArea p="2" py="8" w="90%" maxW="290">
                <Center mb={3}>
                    <Heading size="xl" fontWeight="600" color="white" _dark={{
                    color: "warmGray.50"}} textAlign={"center"}>
                    InfinityOS
                    </Heading>
                </Center>
                <Avatar size={"xl"} alignSelf={"center"} source={require("../assets/icon_image.jpg")}/>


                <VStack space={3} mt="3">
                <FormControl>
                    <FormControl.Label>Email ID</FormControl.Label>
                    {/* <Input onChangeText={changeEmailHandler}/> */}
                    <Box
                    style={{
                        elevation: 5, 
                        paddingVertical:5,
                        shadowColor: '#000', 
                        shadowOffset: { width: 0, height: 1 }, 
                        shadowOpacity: 0.2, 
                        shadowRadius: 4,
                        borderRadius: 8, 
                        backgroundColor: '#fff',}}>
                        <Input
                            onChangeText={changeEmailHandler}
                            placeholder="Enter email Id"
                            variant="unstyled"
                        />
                    </Box>
                </FormControl>
                <FormControl>
                    <FormControl.Label>Password</FormControl.Label>
                    <Box
                    style={{
                        elevation: 5, 
                        paddingVertical:5,
                        shadowColor: '#000', 
                        shadowOffset: { width: 0, height: 1 }, 
                        shadowOpacity: 0.2, 
                        shadowRadius: 4,
                        borderRadius: 8, 
                        backgroundColor: '#fff',}}>
                        <Input type={showPassword ? "text" : "password"} onChangeText={changePasswordHandler} placeholder="Enter password"
                            variant="unstyled" InputRightElement={
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                <Icon
                                as={<Ionicons name={showPassword ? "eye-off" : "eye"} />}
                                size={5}
                                mr="2"
                                color="muted.400"
                                />
                            </Pressable>
                        }/>
                    </Box>
                    
                </FormControl>
                {errorMessage && <Text color="red.500" fontSize="xs">{errorMessage}</Text>}
                <TouchableOpacity onPress={SignInHandler} activeOpacity={0.8}>
                <LinearGradient
                    // Button Linear Gradient
                    colors={['#693685', '#2c1738']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }} 
                    style={styles.button}>
                    <Text style={styles.btntext}>Log in</Text>
                </LinearGradient>
                </TouchableOpacity>
                
                </VStack>
            </Box>
            {loading && (
                    <View style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10
                    }}>
                         <Spinner color="white" size={"lg"}/>
                    </View>
                )}
        </Center>
    )
}

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
      },
    button:{
        paddingHorizontal:10,
        paddingVertical:11,
        borderRadius:6
    },
    btntext:{
        color:"white",
        textAlign:"center",
        fontWeight:"bold"
    },
    // inputBoxStyle:{
    //     borderWidth:0,
    //     backgroundColor:"white"
    // }
});

export default LoginScreen;