import React, { useState, useEffect, useContext } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Box, HStack, Avatar, Text, Badge, Spacer, Divider, Flex, Pressable, VStack } from 'native-base';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';
import { mainURL } from '../Utils/urls';
import * as ImagePicker from "expo-image-picker";
import Entypo from '@expo/vector-icons/Entypo';
import { UserType } from '../Context/UserContext';

function UsersProfileScreen() {
  const [chatUserInfo, setChatUserInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const {userId, setUserId} = useContext(UserType);

  const route = useRoute();
  const navigation = useNavigation();
  
  const [imageChanged, setImageChanged] = useState(false);
  const { id, isGroupChat } = route.params || {};

  useEffect(() => {
    fetchGroupData();
  }, [imageChanged]);

  const fetchGroupData = async () => {
    try {
      const response = await axios.get(`${mainURL}/get_chat_info/${id}`);
      setChatUserInfo(response.data);
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

  const updateImage = async (uri, fileName)=>{
    const formData = new FormData()
    formData.append("file", {
        uri: uri,
        name: fileName,
        type: "image/jpeg",
    });
    try {
        const response = await axios.patch(
            `${mainURL}/update-groupData/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                  },
            }
        )
        setImageChanged(!imageChanged); 
        fetchGroupData();
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
  // Avoid accessing properties of undefined
  const formattedData = chatUserInfo
    ? [
        { ...chatUserInfo.groupAdmin, role: 'Admin' }, 
        ...(chatUserInfo.groupMembers || []), 
      ]
    : [];

    const baseUrl = `${mainURL}/files/`;
    const imageUrl = chatUserInfo?.image;
    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
    const filename = normalizedPath.split('/').pop();
    const source = selectedFile?.uri 
    ? { uri: selectedFile.uri } 
    : chatUserInfo?.image 
        ? { uri: baseUrl + filename } 
        : null;

  //console.log(JSON.stringify(chatUserInfo, null, 2))
  return (
    <Box flex={1} padding={5}  background="black" safeArea width={"full"}>
      <Box flexDirection="row" width={"full"}>
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color="white"
          onPress={() => navigation.goBack()}
        />
      </Box>

      {chatUserInfo && (
        <>
            <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                {isGroupChat && userId === chatUserInfo?.groupAdmin?._id ? <Pressable onPress={handleImage}>
                  {({ isHovered, isFocused, isPressed }) => {
                      return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} borderWidth={1}  rounded="full" style={{
                          transform: [{ scale: isPressed ? 0.96 : 1}]}}>
                          {imageChanged || chatUserInfo.image ? (
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
                </Pressable> : isGroupChat ? <Box maxW="96" bg={'white'} borderWidth={1}  rounded="full">
                          {imageChanged || chatUserInfo.image ? (
                                  <Avatar size="2xl" source={source} />
                              ) : (
                                  <Ionicons name="person-circle-outline" size={100} color="gray" />
                              )}
                          
                      </Box> : <Box maxW="96" bg={'white'} borderWidth={1}  rounded="full" marginBottom={10} marginTop={10}>
                          {imageChanged || chatUserInfo.image ? (
                                  <Avatar size={280} source={source} />
                              ) : (
                                  <Ionicons name="person-circle-outline" size={230} color="gray" />
                              )}
                        </Box>}
                
                {!isGroupChat && 
                <>
                  <HStack alignItems="center" pb={5}>
                    <VStack>
                      <Text color={"coolGray.400"}>User name</Text>
                      <Text fontSize={"md"} bold color={"white"}>
                          {chatUserInfo.user_name}
                      </Text>
                    </VStack>
                    <Spacer />
                  </HStack>
                  <HStack alignItems="center">
                    <VStack>
                      <Text color={"coolGray.400"}>Email address</Text>
                      <Text fontSize={"md"} bold color={"white"}>
                          {chatUserInfo.email}
                      </Text>
                    </VStack>
                    <Spacer />
                  </HStack>
                </>}

                {isGroupChat && <Text fontSize="lg" fontWeight="semibold">
                    {chatUserInfo.groupName}
                </Text>}
                {isGroupChat && <Flex direction="row" justifyContent="center" w="full" h="58" p="4">
                    <Text color="trueGray.200" fontSize="md">
                    Group
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.200" fontSize="md">
                    {formattedData.length} Members
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.200" fontSize="md">
                    {moment(chatUserInfo.created_date).format('DD/MM/YYYY')}
                    </Text>
                </Flex>}
            </Box>
        </>
      )}
        {isGroupChat && 
        <>
          <Text color="trueGray.200" fontSize="sm">
            {formattedData.length} members
          </Text>
          <FlatList
            data={formattedData}
            contentContainerStyle={{ }}
            renderItem={({ item,index }) => {

              const baseUrl = `${mainURL}/files/`;
              const imageUrl = item.image;
              const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
              const filename = normalizedPath.split('/').pop();

              const source = item.image 
                  ? { uri: baseUrl + filename } 
                  : null;
              return(
                <Box
                  borderBottomWidth="1"
                  _dark={{ borderColor: "muted.50" }}
                  borderColor="white"
                  pl={["0", "4"]}
                  pr={["0", "5"]}
                  py="2"
                  key={index}
                >
                  <HStack space={[2, 3]} alignItems="center">
                    {source ? <Avatar size="md"marginRight={2} source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                    <Text _dark={{ color: "warmGray.50" }} color="white" bold>
                      {item.user_name}
                    </Text>
                    <Spacer />
                    {item.role === 'Admin' && <Badge colorScheme="success">Admin</Badge>}
                  </HStack>
                </Box>
              )}}
            keyExtractor={(item) => item._id}
          />
        </>}
      
    </Box>
  );
}

export default UsersProfileScreen;
