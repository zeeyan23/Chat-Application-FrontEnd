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
function UserChat({ item, selectedChats, setSelectedChats,onPinUpdate }) {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const [friendsData, setFriendsData] = useState([]);
  const toast = useToast();

  const [showUnPin, setShowUnPin]=useState(false);
  const [messages, setMessages]=useState([]);

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
    // try {
    //   const chatId = item._id;
    //   const isPinned = await checkChatInDB(chatId, userId);

    //   setSelectedChats((prevSelectedChats) => {
    //     const isSelected = prevSelectedChats.includes(chatId);
    //     let updatedChats;
  
    //     if (isSelected) {
    //       updatedChats = prevSelectedChats.filter((id) => id !== chatId);
    //     } else {
    //       updatedChats = [...prevSelectedChats, chatId];
    //     }
  
    //     if (updatedChats.length > 0) {
    //       checkChatInDB(updatedChats[0], userId).then((response) => {
    //         setShowUnPin(response);
    //       });
    //     } else {
    //       setShowUnPin(false);
    //     }
  
    //     return updatedChats;
    //   });
    // } catch (error) {
    //   console.log("Error in handleSelectedChat:", error);
    //   if (error.response) {
    //     console.log("Server Error:", error.response.data);
    //   } else if (error.request) {
    //     console.log("Network Error:", error.request);
    //   } else {
    //     console.log("Other Error:", error.message);
    //   }
    // }
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
      userId: userId, // Replace with the logged-in user's ID
      pinnedChats: Array.isArray(selectedChats) ? selectedChats : [selectedChats],
    };
    try {
      const response = await axios.patch(`${mainURL}/updatePinnedChats`, formData);
      setSelectedChats([]);
      //onPinUpdate();
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
      });
    } else if (item.type === 'group') {
      navigation.navigate("MessageScreen", {
        groupName: item.groupName,
        isGroupChat: true,
        groupId: item._id
      });
    }
  };

  //console.log(JSON.stringify(item, null, 2))
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
              <Avatar size="48px" source={{ uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" }} />
              <VStack alignSelf="center">
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
