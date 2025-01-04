import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useContext } from "react";
import { useState } from "react";
import {  View } from "react-native";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import { Avatar, Box, FlatList, HStack, Pressable, ScrollView, Spacer, VStack, Text, Stagger, useDisclose, IconButton, Icon, Menu } from "native-base";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import UserChat from "./UserChat";
import io from "socket.io-client";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Entypo, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
function ChatScreen(){

  const [friendsData, setFriendsData]=useState([]);
  const [messages, setMessages]=useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [friendsWithLastMessage, setFriendsWithLastMessage] = useState([]);

  const {userId, setUserId} = useContext(UserType);
  const navigation = useNavigation();
  const socket = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen((prev) => !prev);

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;
    setUserId(userId);

    try {
      const response = await axios.get(
          `${mainURL}/get-all-friends/${userId}`
      );
      if (response.status === 200) {
          setFriendsData(response.data);

          const friendsData = response.data.friends || [];  
          const pinnedChats = response.data.pinnedChats || [];
          const groupsData = response.data.groups || [];
          const groupMembershipsData = response.data.groupMembers || [];
          if (Array.isArray(friendsData)) {
              const updatedFriends = await Promise.all(
                  friendsData.map(async (friend) => {
                    const lastMessage = await fetchLastMessageForFriend(userId, friend._id, 'friend');

                      const isPinned = pinnedChats.some(chat => chat._id === friend._id);

                      return { ...friend, lastMessage, isPinned, type: 'friend' };
                  })
              );

              const updatedGroups = await Promise.all(
                groupsData.map(async (group) => {
                  const lastMessage = await fetchLastMessageForFriend(null, group._id, 'group');

                    const isPinned = pinnedChats.some(chat => chat._id === group._id);

                    return { ...group, lastMessage, isPinned, type: 'group' };
                })
              );

              const combinedData = [...updatedGroups, ...updatedFriends, ...groupMembershipsData];

              combinedData.sort((a, b) => {

                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;  
                  const timestampA = moment(a.lastMessage?.timeStamp);
                  const timestampB = moment(b.lastMessage?.timeStamp);
                  return timestampB.isBefore(timestampA) ? -1 : 1;
              });
              setFriendsWithLastMessage(combinedData);
          } else {
              console.log('Error: Expected friends to be an array but received:', friendsData);
          }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (error.response) {
          console.log('Server Error:', error.response.data);
      } else if (error.request) {
          console.log('Network Error:', error.request);
      } else {
          console.log('Other Error:', error.message);
      }
    } 
  }

  useEffect(() => {
    fetchUser();
  }, []);

    const fetchLastMessageForFriend = async (userId,targetId, type = 'friend') => {
        try {
          const endpoint =
          type === 'group'
              ? `${mainURL}/get-group-messages/${targetId}` // Use group-specific endpoint
              : `${mainURL}/get-messages/${userId}/${targetId}`; // Use friend-specific endpoint

      const response = await axios.get(endpoint);
            const messages = response.data.message.filter(
                (message) => !message.clearedBy.includes(userId)
            );
            const lastMessage = messages[messages.length - 1] || null;
            return lastMessage;
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return null; 
          }
          console.error(`Error fetching messages for friend ID ${friendId}:`, error);
          return null;
        }
    };
    
      const handleNewMessage = (data) => {
        setFriendsWithLastMessage((prevFriends) => {
          const friendIndex = prevFriends.findIndex(
            (friend) => friend._id === data.senderId || friend._id === data.receiverId
          );
      
          if (friendIndex === -1) {
            return prevFriends;
          }
          const updatedFriends = [...prevFriends];
          const friendToUpdate = updatedFriends[friendIndex];
          updatedFriends[friendIndex] = {
            ...friendToUpdate,
            lastMessage: {
              ...friendToUpdate.lastMessage,
              message: data.message,
              timeStamp: data.timestamp,
            },
          };
          const reorderedFriends = [
            updatedFriends[friendIndex],
            ...updatedFriends.filter((_, index) => index !== friendIndex),
          ];
      
          return reorderedFriends;
        });
        fetchUser();
      };
      
    useEffect(() => {
        socket.current = io(mainURL);
        socket.current.emit("registerUser", userId);
        socket.current.on("pinnedChatsUpdated", (updatedPinnedChats) => {
      
        setFriendsData((prevData) => ({
            ...prevData,
            friends: prevData.friends.map((friend) => ({
              ...friend,
              isPinned: updatedPinnedChats.includes(friend._id),
            })),
          }));
        });
      
        socket.current.on("update_chat", (data) => {
            handleNewMessage(data);
          });
        return () => {
          socket.current.disconnect();
        };
      }, [userId]);
      
      //console.log(JSON.stringify(friendsWithLastMessage, null, 2))
    return(
        <>
        
          <ScrollView background={"white"}> 
              <Pressable>
                  {friendsWithLastMessage?.map((item, index)=>(
                      <UserChat key={index} item={item} selectedChats={selectedChats} setSelectedChats={setSelectedChats} onPinUpdate={fetchUser}/>
                  ))}
              </Pressable>
          </ScrollView>
          <Box style={{ position: "absolute" }} alignSelf={"flex-end"} bottom={20} right={5} >
            <Stagger visible={isOpen} initial={{ opacity: 0, scale: 0, translateY: 34 }} 
              animate={{ translateY: 0, scale: 1, opacity: 1, 
              transition: { type: "spring", mass: 0.8, stagger: { offset: 30, reverse: true } } }} 
              exit={{ translateY: 34, scale: 0.5, opacity: 0, transition: { duration: 100, 
              stagger: { offset: 30, reverse: true } } }}>

              <IconButton mb="4" variant="solid" bg="blue.500" colorScheme="indigo" 
                  borderRadius="full" icon={<Icon as={Ionicons} size="6" name="people-sharp" 
                  _dark={{ color: "warmGray.50" }} color="warmGray.50" />} onPress={()=>navigation.navigate("FriendRequests")}/>
                    
              <IconButton mb="4" variant="solid" bg="green.500" colorScheme="yellow" 
                  borderRadius="full" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                  size="6" name="add-circle-outline" color="warmGray.50" />} onPress={()=>navigation.navigate("AddFriendsToGroup")}/>

              <IconButton mb="4" variant="solid" bg="amber.500" colorScheme="yellow" 
                  borderRadius="full" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                  size="6" name="person-add" color="warmGray.50" />} onPress={()=>navigation.navigate("Home")}/>
                    
            </Stagger>
          </Box>
          <HStack position={"absolute"} alignSelf={"flex-end"} bottom={10} right={5} >
            <IconButton variant="solid" borderRadius="full" size="lg" onPress={onToggle} bg="cyan.400" icon={<Icon as={MaterialCommunityIcons} size="6" name="dots-horizontal" color="warmGray.50" _dark={{ color: "warmGray.50" }} />} />
          </HStack>
        </>
    )
}

export default ChatScreen;