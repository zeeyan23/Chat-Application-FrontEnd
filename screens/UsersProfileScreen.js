import React, { useState, useEffect } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Box, HStack, Avatar, Text, Badge, Spacer, Divider, Flex, Pressable } from 'native-base';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';
import { mainURL } from '../Utils/urls';
import * as ImagePicker from "expo-image-picker";
import Entypo from '@expo/vector-icons/Entypo';

function UsersProfileScreen() {
  const [groupData, setGroupData] = useState(null); // Initialize as null instead of an array
  const route = useRoute();
  const navigation = useNavigation();
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const { groupId } = route.params || {};

  useEffect(() => {
    fetchGroupData();
  }, [imageChanged]);

  const fetchGroupData = async () => {
    try {
      const response = await axios.get(`${mainURL}/get-groupInfo/${groupId}`);
      setGroupData(response.data);
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
            `${mainURL}/update-groupData/${groupId}`,
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
  const formattedData = groupData
    ? [
        { ...groupData.groupAdmin, role: 'Admin' }, // Admin with role
        ...(groupData.groupMembers || []), // Participants without role
      ]
    : [];

    const baseUrl = `${mainURL}/files/`;
    const imageUrl = groupData?.image;
    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
    const filename = normalizedPath.split('/').pop();
    //const source = { uri: baseUrl + filename };

    const source = selectedFile?.uri 
    ? { uri: selectedFile.uri } 
    : groupData?.image 
        ? { uri: baseUrl + filename } 
        : null;
  return (
    <Box flex={1} padding={5}  background="white" safeArea width={"full"}>
      {/* Back Button */}
      <Box flexDirection="row" width={"full"}>
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color="black"
          onPress={() => navigation.goBack()}
        />
      </Box>

      {/* Group Info */}
      {groupData && (
        <>
            <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                <Pressable onPress={handleImage}>
                  {({ isHovered, isFocused, isPressed }) => {
                      return <Box maxW="96" bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'white'} borderWidth={1}  rounded="full" style={{
                          transform: [{ scale: isPressed ? 0.96 : 1}]}}>
                          {imageChanged || groupData.image ? (
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
                <Text fontSize="lg" fontWeight="semibold">
                    {groupData.groupName}
                </Text>
                <Flex direction="row" justifyContent="center" w="full" h="58" p="4">
                    <Text color="trueGray.700" fontSize="md">
                    Group
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.700" fontSize="md">
                    {formattedData.length} Members
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.700" fontSize="md">
                    {moment(groupData.created_date).format('DD/MM/YYYY')}
                    </Text>
                </Flex>
            </Box>
        </>
      )}
        <Text color="trueGray.700" fontSize="sm">
          {formattedData.length} members
        </Text>
        <FlatList
          data={formattedData}
          contentContainerStyle={{ }}
          renderItem={({ item }) => {

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
                borderColor="muted.800"
                pl={["0", "4"]}
                pr={["0", "5"]}
                py="2"
              >
                <HStack space={[2, 3]} alignItems="center">
                  {source ? <Avatar size="md"marginRight={2} source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                  <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                    {item.user_name}
                  </Text>
                  <Spacer />
                  {item.role === 'Admin' && <Badge colorScheme="success">Admin</Badge>}
                </HStack>
              </Box>
            )}}
          keyExtractor={(item) => item._id}
        />
      
    </Box>
  );
}

export default UsersProfileScreen;
