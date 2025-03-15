import React, { useState, useEffect, useContext } from 'react';
import { ActionSheetIOS, Alert, Platform, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Box, HStack, Avatar, Text, Badge, Spacer, Divider, Flex, Pressable, VStack, Center, FlatList, View } from 'native-base';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';
import { mainURL } from '../Utils/urls';
import * as ImagePicker from "expo-image-picker";
import Entypo from '@expo/vector-icons/Entypo';
import { UserType } from '../Context/UserContext';
import ConfirmationDialog from "../components/ConfirmationDialog";

function UsersProfileScreen() {
  const [chatUserInfo, setChatUserInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const {userId, setUserId} = useContext(UserType);

  const [isDialogOpen, setDialogOpen] = useState(false);

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  const route = useRoute();
  const navigation = useNavigation();
  
  const [imageChanged, setImageChanged] = useState(false);
  const { id, isGroupChat } = route.params || {};

  useEffect(() => {
    fetchGroupData();
  }, [imageChanged]);

  const fetchGroupData = async () => {
    try {
      const response = await axios.get(`${mainURL}/friend/get_chat_info/${id}`);
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
            `${mainURL}/group/update-groupData/${id}`,
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

  function renderGroupProfile(){
    return(
      <Center>
        <Pressable onPress={handleImage}>
          {({ isHovered, isFocused, isPressed }) => {
            return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} borderWidth={1}  rounded="full" style={{
              transform: [{ scale: isPressed ? 0.96 : 1}]}} marginBottom={3}>
              {imageChanged || chatUserInfo.image ? (
              <Avatar size="2xl" source={source} /> ) : ( <Ionicons name="person-circle-outline" size={100} color="gray" />)}
              <Box position="absolute" bottom="0" right="2" bg="white" p="1" rounded="full" justifyContent="center"  alignItems="center">
                <Entypo name="pencil" size={18} color="green" />
              </Box>
            </Box>
            }}
        </Pressable>
        <Text fontSize="lg" fontWeight="bold" mt={2}>{chatUserInfo.groupName}</Text>
        <Flex direction="row" alignItems="center" justifyContent="center" justifyItems={"center"} w="full" h="10">
          <Text color="gray.500">Group</Text>
          <Entypo name="dot-single" size={20} color="grey" />
          <Text color="gray.500" textAlign={"center"}>{formattedData.length} Members</Text>
        </Flex>

      </Center>
    )
  }

  function renderGroupProfileForMembers(){
    return(
      <Center>
        <Pressable>
          {({ isHovered, isFocused, isPressed }) => {
            return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} borderWidth={1}  rounded="full" style={{
              transform: [{ scale: isPressed ? 0.96 : 1}]}} marginBottom={3}>
              {chatUserInfo.image ? (
              <Avatar size="2xl" source={source} /> ) : ( <Ionicons name="person-circle-outline" size={100} color="gray" />)}
            </Box>
            }}
        </Pressable>
        <Text fontSize="lg" fontWeight="bold" mt={2}>{chatUserInfo.groupName}</Text>
        <Flex direction="row" justifyContent="center" alignItems={"center"} alignContent={"center"} w="full" h="10">
          <Text color="gray.500">Group </Text>
          <Box>
            <Entypo name="dot-single" size={20} color="grey"/>
          </Box>

          <Text color="gray.500">{formattedData.length} Members</Text>
        </Flex>
      </Center>
    )
  }

  function renderSingleUserProfile(){
    return(
      <Center>
        {chatUserInfo.image ? (
          <Box paddingY={12}>
            <Avatar size="2xl" source={source}/>
          </Box>
          ) : (
          <Box paddingY={12}>
            <Ionicons name="person-circle-outline" size={100} color="gray" />
          </Box>
          )}
          <>
            <HStack alignItems="center" pb={5}>
              <VStack>
                <Text color={"trueGray.600"}>User name</Text>
                <Text fontSize={"md"} bold>
                  {chatUserInfo.user_name}
                </Text>
              </VStack>
              <Spacer />
            </HStack>
            <HStack alignItems="center">
              <VStack>
                <Text color={"trueGray.600"}>Email address</Text>
                <Text fontSize={"md"} bold>
                  {chatUserInfo.email}
                </Text>
              </VStack>
              <Spacer />
            </HStack>
          </>
      </Center>
    )
  }

  const deleteGroupHandle = async () => {
    try {
      const response = await axios.patch(`${mainURL}/group/delete_group/${id}`);
      navigation.navigate("Chats");
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
    closeDialog();
  };
  
  return (
    <Box flex={1} padding={5}  background="black" safeArea width={"full"}>
      <Box flexDirection="row" width={"full"} paddingBottom={5}>
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color="white"
          onPress={() => navigation.goBack()}
        />
      </Box>

      {chatUserInfo && (
        <Box flexDirection="column" width="full" alignItems="center" alignContent="center">

        {/* Group Icon, Name, and Members Card */}
          <Box bg="white" borderRadius="lg" p={4} mb={4} shadow={2} width="full">
            {isGroupChat && userId === chatUserInfo?.groupAdmin?._id ? renderGroupProfile() : 
              isGroupChat && userId != chatUserInfo?.groupAdmin?._id ? renderGroupProfileForMembers() : renderSingleUserProfile()}
          </Box>
        
          {/* Created By and Date Card */}
          {isGroupChat && <Box bg="white" borderRadius="lg" p={4} mb={4} shadow={2} width="full">
            <HStack justifyContent="space-between">
              {userId === chatUserInfo?.groupAdmin?._id ? <Text color="gray.600">Created you: {chatUserInfo.groupAdmin.user_name}</Text> :
                <Text color="gray.600">Created by: {chatUserInfo.groupAdmin.user_name}</Text>}
              <Text color="gray.600">{moment(chatUserInfo.created_date).format('DD/MM/YYYY')}</Text>
            </HStack>
          </Box>}
          
          {/* Group Members List Card */}
          {isGroupChat && 
          <>
            <Box bg="white" borderRadius="lg" p={4}  mb={4} shadow={2} width="full">
              <Text color="gray.500">Total Members: {formattedData.length}</Text>
              <Pressable onPress={()=>navigation.navigate("AddFriendsToGroup",{ isMemberAdd : true, groupId: id} )} _hover={{ bg: 'gray.100' }}  _pressed={{ bg: 'gray.200' }}  
                _focus={{ borderColor: 'blue.500', borderWidth: 1 }} borderRadius="md" pr={2} pt={2} pb={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold" fontSize="md">Add Members</Text>
                  <Ionicons name="person-add" size={24} color="white" style={{backgroundColor:"#0E8C00", padding:8, borderRadius:50}}/>
                </HStack>
              </Pressable>
              <FlatList
                data={formattedData}
                style={{ height: Math.min(formattedData.length * 70, 230) }}
                paddingBottom={10}
                renderItem={({ item,index }) => {
                  const baseUrl = `${mainURL}/files/`;
                  const imageUrl = item.image;
                  const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                  const filename = normalizedPath.split('/').pop();

                  const source = item.image 
                      ? { uri: baseUrl + filename } 
                      : null;
                  return(
                    <Box borderBottomWidth={1} borderBottomColor="gray.200" py={2}>
                      <HStack space={3} alignItems="center" >
                        {source ? <Avatar size="md"marginRight={2} source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                        <Text fontWeight="bold">{item.user_name}</Text>
                        <Spacer />
                        {item.role === 'Admin' && <Badge colorScheme="success">Admin</Badge>}
                      </HStack>
                    </Box>)}} keyExtractor={(item) => item._id} />
              
            </Box>
          </>}
          {isGroupChat && <Box bg="white" borderRadius="lg" shadow={2} width="full">
            <Pressable _hover={{ bg: 'red.100' }}  _pressed={{ bg: 'red.200' }}  
                _focus={{ borderColor: 'blue.500', borderWidth: 1 }} borderRadius="md" p={1} onPress={openDialog}>
                <HStack alignItems="center" alignSelf={"center"}>
                  <Text fontWeight="bold" fontSize="md">Delete Group</Text>
                  <Ionicons name="trash" size={20} color="white" style={{backgroundColor:"red", padding:5, borderRadius:50, marginHorizontal:5}}/>
                </HStack>
            </Pressable>
            <ConfirmationDialog
              isOpen={isDialogOpen} 
              onClose={closeDialog}
              onConfirm={deleteGroupHandle}
              header="Delete Group?"
              body="Are you sure you want to delete this group?"
              confirmText="Delete"
              cancelText="Cancel"
            />
          </Box>}
        </Box>
      )}
      
    </Box>
  );
}

export default UsersProfileScreen;
