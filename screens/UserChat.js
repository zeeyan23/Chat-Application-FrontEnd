import { useNavigation } from "@react-navigation/native";
import { Avatar, Box, FlatList, HStack, Menu, Spacer, Text, VStack } from "native-base";
import { Pressable } from "react-native";
import { mainURL } from "../Utils/urls";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { UserType } from "../Context/UserContext";
import axios from "axios";
import { Entypo } from "@expo/vector-icons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import io from "socket.io-client";
import moment from "moment";
import { useToast } from 'native-base';
import Ionicons from '@expo/vector-icons/Ionicons';
function UserChat({ item, selectedChats, setSelectedChats,onPinUpdate }) {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const toast = useToast();

  const [showUnPin, setShowUnPin]=useState(false);

  function formatTime(time) {
    const input = moment(time);
    const today = moment();
  
    if (input.isSame(today, 'day')) {
      return input.format('HH:mm'); 
    } else if (input.isSame(today, 'week')) {
      return input.format('dddd'); 
    } else {
      return input.format('DD-MM-YYYY');
    }
  }

  const checkChatInDB = async (id, userId) => {
    try {
      const response = await axios.get(`${mainURL}/get-pinned-chats/${id}/${userId}`);
      return response.data.exists;
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
  };

  const handleSelectedChat = async (item) => {
    const chatId = item._id;
    const isSelected = selectedChats.includes(chatId);
    const updatedChats = isSelected
      ? selectedChats.filter(id => id !== chatId)
      : [...selectedChats, chatId];

    setSelectedChats(updatedChats);
    checkChatInDB(updatedChats[0], userId).then(response => {
      setShowUnPin(response);
    });
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:"",
      headerLeft:()=>(
          <Box paddingLeft={4}>
              <Text fontWeight={"bold"} fontSize={16}>Chat App</Text>
          </Box>
      ),
      headerRight: () =>
        selectedChats.length > 0 ? (
          <Box flexDirection="row" alignItems="center" style={{ marginRight: 10, gap: 20 }}>
            {/* Show pin-off if showUnPin is true, else show pin */}
            {!showUnPin ? (
              <Pressable onPress={() => pinChats(selectedChats)}>
                <MaterialCommunityIcons name="pin" size={24} color="black" />
              </Pressable>
            ) : (
              <Pressable onPress={() => unPinChats(selectedChats)}>
                <MaterialCommunityIcons name="pin-off" size={24} color="black" />
              </Pressable>
            )}
          </Box>
        ) :  
        <Box w="90%" alignItems="flex-end" paddingRight={4}>
            <Menu w="190" trigger={triggerProps => {
            return <Pressable accessibilityLabel="More options menu" {...triggerProps}>
            <Entypo name="dots-three-vertical" size={20} color="black" />
          </Pressable>;
            }}>
                <Menu.Item onPress={() => navigation.navigate('StarredMessageScreen')}>Starred Messages</Menu.Item>
                <Menu.Item onPress={() => navigation.navigate('Settings')}>Settings</Menu.Item>
            </Menu>
        </Box>,
    });
  }, [navigation, selectedChats, showUnPin]);
  
  const pinChats = async (selectedChats) => {
    const formData = {
      userId: userId,
      pinnedChats: Array.isArray(selectedChats) ? selectedChats : [selectedChats],
    };
    try {
      const response = await axios.patch(`${mainURL}/updatePinnedChats`, formData);
      setSelectedChats([]);
      toast.show({description:"Chat Pinned"})
      if (onPinUpdate) {
        onPinUpdate();
        
      }
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

  const unPinChats = async (selectedChats) => {
    try {
      const requests = selectedChats.map(chatId =>
        axios.delete(`${mainURL}/unPinChats/${chatId}/${userId}`)
      );
      const responses = await Promise.all(requests);
      toast.show({description:"Chat Unpinned"})
      setSelectedChats([]); 
      setShowUnPin(false);
      if (onPinUpdate) {
        onPinUpdate();
      }
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
  
  const truncateText = (text, wordLimit) => {
    if (!text) return ""; // Handle cases where text is undefined or null
    const words = text.split(" ");
    return words.length > wordLimit 
      ? words.slice(0, wordLimit).join(" ") + "..." 
      : text;
  };
  
  const handlePress = () => {
    if (item.type === 'friend') {
      navigation.navigate("MessageScreen", {
        userName: item.user_name,
        recipentId: item._id,
        userImage: item.image
      });
    } else if (item.type === 'group') {
      navigation.navigate("MessageScreen", {
        groupName: item.groupName,
        isGroupChat: true,
        groupId: item._id,
        groupImage : item.image
      });
    }
  };

  const baseUrl = `${mainURL}/files/`;
    const imageUrl = item?.image;
    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
    const filename = normalizedPath.split('/').pop();

    const source =  item.image ? { uri: baseUrl + filename } : null;
  return (
    <Box flex={1} backgroundColor="white">
      <Pressable
        onPress={()=>handlePress(item)} onLongPress={()=> handleSelectedChat(item)}>
        {({ isHovered, isFocused, isPressed }) => (
          <Box
            borderBottomWidth="1"
            _dark={{ borderColor: "muted.50" }}
            borderColor="muted.200"
            pl={["2", "4"]}
            pr={["2", "5"]}
            py="2"
            bg={isPressed ? "coolGray.200" : isHovered ? "coolGray.200" : "coolGray.100"}
            style={{
              backgroundColor: selectedChats.includes(item._id) ? 'lightgray' : 'white', 
            }}
          >
            <HStack space={[2, 3]} justifyContent="space-between">
              {source ? <Avatar size="48px" source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
              <VStack>
                <Text fontSize="md" color="black" style={{ fontWeight: "bold" }}>{item.type === 'friend' ? item.user_name : item.groupName}</Text>
                <Text 
                  style={{ marginTop: 3, color: "gray", fontWeight: "500" }} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {truncateText(item.lastMessage?.message || item.lastMessage?.fileName, 5)}
                </Text>

              </VStack>
              <Spacer />
              <Box justifyContent={"center"} alignItems={"center"}>
              <Text>
                {formatTime(item.lastMessage?.timeStamp) || ""}
              </Text>
              {item.isPinned && <MaterialCommunityIcons name="pin" size={20} color="grey" />}
              </Box>
              
            </HStack>
          </Box>
        )}
      </Pressable>
    </Box>
  );
}

export default UserChat;
