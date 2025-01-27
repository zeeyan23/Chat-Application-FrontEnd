import { Actionsheet, Avatar, Badge, Box, Button, Flex, HStack, Icon, Input, Pressable, Spacer, Text, useDisclose, View, VStack } from "native-base";
import { useContext, useEffect, useState } from "react";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { UserType } from "../Context/UserContext";
import Entypo from '@expo/vector-icons/Entypo';
import { Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
function UserSettings(){

    const [user, setUser]=useState([]);
    const {userId, setUserId} = useContext(UserType);
    const { isOpen, onOpen, onClose } = useDisclose();
    const [editType, setEditType] = useState(""); 
    const [inputValue, setInputValue] = useState("");

    const [selectedFile, setSelectedFile] = useState(null);
    const [imageChanged, setImageChanged] = useState(false);
    const navigation = useNavigation();
    useEffect(() => {
        fetchUserData();
      }, [imageChanged]);
    
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`${mainURL}/user-data/${userId}`);
          setUser(response.data);
        } catch (error) {
          console.log('Error:', error);
          if (error.response) {
            console.log('Server Error:', error.response.data);
          } else if (error.request) {
            console.log('Network Error:', error.request);
          } else {
            console.log('Other Error:', error.message);
          }
        }
      };

      const saveUserChanges = async (userId, field, value) => {
        try {
          const payload = {
            userId,
            [field]: value, // Dynamically assign the field (e.g., user_name or email)
          };
      
          const response = await axios.patch(`${mainURL}/users/update`, payload);
      
          if (response.status === 200) {
            console.log("Changes saved successfully:", response.data);
            return { success: true, data: response.data };
          } else {
            console.error("Failed to save changes:", response.data);
            return { success: false, error: response.data };
          }
        } catch (error) {
          console.error("Error saving changes:", error);
          return { success: false, error };
        }
      };

    const updateImage = async (uri, fileName)=>{
        const formData = new FormData()
        formData.append("file", {
            uri: uri,
            name: fileName,
            type: "image/jpeg",
        });
        try {
            const response = await axios.patch(
                `${mainURL}/update-userdata/${userId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                }
            )
            setImageChanged(!imageChanged); 
            fetchUserData();
        } catch (error) {
            console.log('Error:', error); 
            if (error.response) {
                console.log('Server Error:', error.response.data); 
            } else if (error.request) {
                console.log('Network Error:', error.request); 
            } else {
                console.log('Other Error:', error.message); 
            }
            if (error.request && !error._retry) {
                error._retry = true;
                console.log('Retrying...');
                return updateImage(uri, fileName);
            }
        }
    }
    
    const handleImage = async ()=>{
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsEditing: true, aspect: [4, 3],
            quality: 1,});

        if(!result.canceled){
            const asset = result.assets[0];
            const fileName = asset.fileName || asset.uri.split('/').pop();
            setSelectedFile({
                uri: asset.uri,
                fileName: asset.fileName || null,
            });
            setTimeout(async () => {
                await updateImage(asset.uri, fileName);
            }, 100); 
        }
    }

    const baseUrl = `${mainURL}/files/`;
    const imageUrl = user.image;
    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
    const filename = normalizedPath.split('/').pop();
    const source = selectedFile?.uri 
    ? { uri: selectedFile.uri } 
    : user.image 
        ? { uri: baseUrl + filename } 
        : null;

    const handleLogout = async()=>{
      try {
        await AsyncStorage.removeItem("authToken");
        console.log("Token removed successfully");

        navigation.replace("Login");
      } catch (error) {
        console.log('Error:', error); 
        if (error.response) {
            console.log('Server Error:', error.response.data); 
        } else if (error.request) {
            console.log('Network Error:', error.request); 
        } else {
            console.log('Other Error:', error.message); 
        }
      }
    }
    return(
        <>
            <Box flex={1} flexDirection="column" width={"full"} padding={5}  background="white" >
              <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                <Pressable onPress={handleImage}>
                      {({ isHovered, isFocused, isPressed }) => {
                          return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} borderWidth={1}  rounded="full" style={{
                              transform: [{ scale: isPressed ? 0.96 : 1}]}}>
                              {imageChanged || user.image ? (
                                <Avatar size="2xl" source={source} />
                                  ) : (
                                <Ionicons name="person-circle-outline" size={100} color="gray" />
                                  )}
                              <Box position="absolute" bottom="0" right="2" bg="white" p="1" rounded="full" justifyContent="center" 
                                  alignItems="center">
                                  <Entypo name="pencil" size={18} color="green" />
                              </Box>
                          </Box>
                      }}
                  </Pressable>
                    <Pressable onPress={() => {
                      setEditType("user_name"); 
                      setInputValue(user.user_name); 
                      onOpen();
                    }}>
                        {({ isHovered, isFocused, isPressed }) => {
                            return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} p="3" rounded="8" style={{
                                transform: [{ scale: isPressed ? 0.96 : 1}]}}>
                                <Text fontSize="2xl" fontWeight="semibold" style={styles.superscript}>
                                    {user.user_name} <Entypo name="pencil" size={18} color="green" />
                                </Text>
                            </Box>
                        }}
                </Pressable>
            </Box>
            <Pressable onPress={() => {
              setEditType("email"); 
              setInputValue(user.email); 
              onOpen();}}>
                {({ isHovered, isFocused, isPressed }) => {
                    return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} p="3" rounded="8" style={{
                        transform: [{ scale: isPressed ? 0.96 : 1}]}}>
                        <HStack alignItems="center">
                            <VStack>
                            <Text color={"trueGray.600"}>Email address</Text>
                            <Text fontSize={"md"} bold>
                                {user.email}
                            </Text>
                            </VStack>
                            <Spacer />
                            <Entypo name="pencil" size={24} color="green" />
                        </HStack>
                    </Box>
                }}
            </Pressable>
              <Box flex={1} justifyContent="flex-end" alignItems="center">
                <Pressable onPress={handleLogout} width={"full"}>
                    {({
                      isHovered,
                      isFocused,
                      isPressed
                    }) => {
                      return <Box bg={isPressed ? "blue.900" : isHovered ? "blue.800" : "coolGray.800"} style={{
                        transform: [{
                          scale: isPressed ? 0.96 : 1
                        }]
                      }} p="2" rounded="8"  borderWidth="1" borderColor="coolGray.300">
                            
                            <Text color="white" fontWeight="medium" fontSize="md" textAlign={"center"}>
                              Logout
                            </Text>
                          </Box>
                    }}
                </Pressable>
              </Box>
            </Box>
            <Actionsheet isOpen={isOpen} onClose={onClose}>
              <Actionsheet.Content>
                <Box w="100%" px={4} py={2}>
                  <Text fontSize="16" color="gray.500">
                    Edit {editType === "user_name" ? "User Name" : "Email Address"}
                  </Text>
                </Box>
                <Box w="100%" px={4} py={2}>
                  <Input
                    placeholder={`Enter new ${editType === "user_name" ? "user name" : "email address"}`}
                    value={inputValue}
                    onChangeText={(text) => setInputValue(text)}
                  />
                </Box>
                <Actionsheet.Item
                  onPress={async () => {
                    const result = await saveUserChanges(user._id, editType, inputValue);                
                    if (result.success) {
                      if (editType === "user_name") {
                        user.user_name = inputValue;
                      } else if (editType === "email") {
                        user.email = inputValue;
                      }
                      console.log("User updated locally:", user);
                    } else {
                      console.error("Failed to update user:", result.error);
                    }
                    onClose();
                  }}
                >
                  Save
                </Actionsheet.Item>
                <Actionsheet.Item onPress={onClose}>Cancel</Actionsheet.Item>
              </Actionsheet.Content>
            </Actionsheet>
        </>
    )
}

const styles= StyleSheet.create({
    superscript: { 
      },
})
export default UserSettings;