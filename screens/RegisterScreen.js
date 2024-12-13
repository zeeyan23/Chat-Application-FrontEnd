import * as React from "react";
import { Box, Text, Heading, VStack, FormControl, Input, Link, Button, HStack, Center, NativeBaseProvider } from "native-base";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { mainURL } from "../Utils/urls.js";
import axios from "axios";
import { useState } from "react";

function RegisterScreen(){

    const navigation = useNavigation();
    const [formData, setData] = useState({});

    function changeNameHandler(enteredValue){
        setData({ ...formData, user_name: enteredValue });
    }

    function changeEmailHandler(enteredValue){
        setData({ ...formData, email: enteredValue });
    }

    function changePasswordHandler(enteredValue){
        setData({ ...formData, password: enteredValue });
    }


    async function createAccount(){
        navigation.navigate('Login');
        try {
            const response = await axios.post(
                `${mainURL}/create_user/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        }  catch (error) {
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
            <Box safeArea p="2" w="90%" maxW="290" py="8">
                <Heading size="lg" color="coolGray.800" _dark={{
                color: "warmGray.50"
            }} fontWeight="semibold">
                Welcome
                </Heading>
                <Heading mt="1" color="coolGray.600" _dark={{
                color: "warmGray.200"
            }} fontWeight="medium" size="xs">
                Sign up to continue!
                </Heading>
                <VStack space={3} mt="5">
                <FormControl>
                    <FormControl.Label>Name</FormControl.Label>
                    <Input onChangeText={changeNameHandler}/>
                </FormControl>
                <FormControl>
                    <FormControl.Label>Email ID</FormControl.Label>
                    <Input onChangeText={changeEmailHandler}/>
                </FormControl>
                <FormControl>
                    <FormControl.Label>Password</FormControl.Label>
                    <Input onChangeText={changePasswordHandler} type="password" />
                </FormControl>
                <Button mt="2" colorScheme="indigo" onPress={createAccount}>
                    Sign up
                </Button>
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

export default RegisterScreen;