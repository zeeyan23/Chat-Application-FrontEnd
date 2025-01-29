import { useNavigation } from "@react-navigation/native";
import { Box, Button, Center, FormControl, Heading, HStack, Icon, Input, Link, Pressable, Text, VStack } from "native-base";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { mainURL } from "../Utils/urls";
import axios from "axios";

function ForgotPassword(){

    const [formData, setData] = useState({});
    const navigation = useNavigation();

    const [error, setError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function changeEmailHandler(enteredValue){
        setData({ ...formData, email: enteredValue });
    }

    function changePasswordHandler(enteredValue){
        setData({ ...formData, password: enteredValue });
    }

    function changeReTypePasswordHandler(enteredValue){
        setData({ ...formData, confirm_password: enteredValue });
    }

    const updatePassword= async()=>{
        if (formData.password !== formData.confirm_password) {
            setError(true);
        } else {
            setError(false);
            try {
                const response = await axios.patch(`${mainURL}/update_password`, formData);
                if (response.status === 200) {
                    navigation.navigate('Login');
                } 
              } catch (error) {
                if (error.response) {
                    if (error.response.status === 404) {
                        setErrorMessage("User not found");
                    } else if(error.response.data && error.response.data.message){
                        setErrorMessage("Failed to update password. Please try again.");
                    }
                } else {
                    setErrorMessage("Network error. Please check your connection.");
                }
            }
        }
    }
    return(
        <Center w="100%" style={styles.container}>
            <Box safeArea p="2" py="8" w="90%" maxW="290">
                <Heading size="lg" fontWeight="600" color="coolGray.800" _dark={{color: "warmGray.50"}}>Update Password</Heading>
                <VStack space={3} mt="5">
                <FormControl>
                    <FormControl.Label>Email ID</FormControl.Label>
                    <Input onChangeText={changeEmailHandler}/>
                </FormControl>
                <FormControl>
                    <FormControl.Label>Password</FormControl.Label>
                    <Input type="password" onChangeText={changePasswordHandler} />
                </FormControl>
                <FormControl>
                    <FormControl.Label>Confirm Password</FormControl.Label>
                    <Input type={showPassword ? "text" : "password"} onChangeText={changeReTypePasswordHandler} InputRightElement={
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Icon
                            as={<Ionicons name={showPassword ? "eye-off" : "eye"} />}
                            size={5}
                            mr="2"
                            color="muted.400"
                            />
                        </Pressable>
                        }/>
                    {error && <Text color="red.500" fontSize="xs">Passwords do not match</Text>}
                </FormControl>
                {errorMessage && <Text color="red.500" fontSize="xs">{errorMessage}</Text>}
                <Button mt="2" colorScheme="indigo" onPress={updatePassword}>
                    UpdatePassword
                </Button>
                </VStack>
            </Box>
        </Center>
    )
}

export default ForgotPassword;

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }
});