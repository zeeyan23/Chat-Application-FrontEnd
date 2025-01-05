import { Actionsheet, Avatar, Box, Flex, HStack, Icon, Input, Pressable, Spacer, Text, useDisclose, View, VStack } from "native-base";
import { useContext, useEffect, useState } from "react";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { UserType } from "../Context/UserContext";
import Entypo from '@expo/vector-icons/Entypo';
import { Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
function UserSettings(){

    const [user, setUser]=useState([]);
    const {userId, setUserId} = useContext(UserType);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageChanged, setImageChanged] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclose();
const [editType, setEditType] = useState(""); // To track the type of edit (email or user name)
const [inputValue, setInputValue] = useState(""); // To hold the input value

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
    //const source = { uri: baseUrl + filename };

    const source = selectedFile?.uri 
    ? { uri: selectedFile.uri } 
    : user.image 
        ? { uri: baseUrl + filename } 
        : null;
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
                                        <Text style={{ color: 'black', textAlign: 'center', lineHeight: 130, width:150 }}>
                                                No Image
                                        </Text>
                                    )}
                                <Box position="absolute" bottom="0" right="2" bg="white" p="1" rounded="full" justifyContent="center" 
                                    alignItems="center">
                                    <Entypo name="pencil" size={18} color="green" />
                                </Box>
                            </Box>
                        }}
                    </Pressable>
                    
                    
                    <Pressable onPress={() => {
        setEditType("user_name"); // Set edit type to user name
        setInputValue(user.user_name); // Pre-fill input with current user name
        onOpen(); // Open Actionsheet
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
        setEditType("email"); // Set edit type to email
        setInputValue(user.email); // Pre-fill input with current email
        onOpen(); // Open Actionsheet
      }}>
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
            </Box>
            <Actionsheet isOpen={isOpen} onClose={onClose}>
      <Actionsheet.Content>
        <Box w="100%" px={4} py={2}>
          <Text fontSize="16" color="gray.500">
            Edit {editType === "user_name" ? "User Name" : "Email Address"}
          </Text>
        </Box>
        {/* Input Field */}
        <Box w="100%" px={4} py={2}>
          <Input
            placeholder={`Enter new ${editType === "user_name" ? "user name" : "email address"}`}
            value={inputValue}
            onChangeText={(text) => setInputValue(text)}
          />
        </Box>
        {/* Save Button */}
        <Actionsheet.Item
          onPress={async () => {
            const result = await saveUserChanges(user._id, editType, inputValue);
        
            if (result.success) {
              // Update the local state to reflect changes
              if (editType === "user_name") {
                user.user_name = inputValue;
              } else if (editType === "email") {
                user.email = inputValue;
              }
              console.log("User updated locally:", user);
            } else {
              console.error("Failed to update user:", result.error);
              // Optionally, show an error message to the user
            }
        
            onClose(); // Close the Actionsheet
          }}
        >
          Save
        </Actionsheet.Item>
        {/* Cancel Button */}
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