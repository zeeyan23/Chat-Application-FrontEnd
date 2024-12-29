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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const onToggle = () => setIsOpen((prev) => !prev);

  useFocusEffect(
    useCallback(() => {
      setIsOpen(false); // Close the Stagger
    }, [])
  );

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;
    setUserId(userId);

    // Fetch initial data via API calls
    try {
      const response = await axios.get(
          `${mainURL}/get-all-friends/${userId}`
      );
      // console.log(response.data)
      if (response.status === 200) {
          setFriendsData(response.data);

          const friendsData = response.data.friends || [];  // Access 'friends' array directly
          const pinnedChats = response.data.pinnedChats || [];
          if (Array.isArray(friendsData)) {
              // Wait for all last messages to be fetched
              const updatedFriends = await Promise.all(
                  friendsData.map(async (friend) => {
                    //console.log(friend._id)
                      const lastMessage = await fetchLastMessageForFriend(userId,friend._id);
                      const isPinned = pinnedChats.some(chat => chat._id === friend._id);

                      return { ...friend, lastMessage, isPinned };
                  })
              );
              updatedFriends.sort((a, b) => {

                  if (a.isPinned && !b.isPinned) return -1; // a comes first
                  if (!a.isPinned && b.isPinned) return 1;  // b comes first
                  const timestampA = moment(a.lastMessage?.timeStamp);
                  const timestampB = moment(b.lastMessage?.timeStamp);
                  return timestampB.isBefore(timestampA) ? -1 : 1; // Ascending order
              });
              setFriendsWithLastMessage(updatedFriends);
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

    const fetchLastMessageForFriend = async (userId,friendId) => {
    
        try {
            const response = await axios.get(`${mainURL}/get-messages/${userId}/${friendId}`);
            //console.log(JSON.stringify(response.data, null, 2))
            const messages = response.data.message.filter(
                (message) => !message.clearedBy.includes(userId)
            );
            const lastMessage = messages[messages.length - 1] || null;
            return lastMessage;
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`No messages found for friend ID ${friendId}`);
            return null; // No messages found, return null
          }
          console.error(`Error fetching messages for friend ID ${friendId}:`, error);
          return null;
        }
    };
    
    // useFocusEffect(
    //     useCallback(() => {
    //       // This will be triggered every time the screen comes into focus
    //       fetchUser();
      
    //       // Cleanup function if needed
    //       return () => {
    //         console.log('ChatScreen unfocused');
    //       };
    //     }, [])
    //   );
    
      const handleNewMessage = (data) => {
        
        setFriendsWithLastMessage((prevFriends) => {
          // Check if the sender or receiver is already in the friends list
          const friendIndex = prevFriends.findIndex(
            (friend) => friend._id === data.senderId || friend._id === data.receiverId
          );
      
          if (friendIndex === -1) {
            return prevFriends; // Return the unchanged list if friend is not found
          }
      
          // Update the friend's last message and timestamp
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
      
          // Move the updated friend to the top of the list
          const reorderedFriends = [
            updatedFriends[friendIndex],
            ...updatedFriends.filter((_, index) => index !== friendIndex),
          ];
      
          return reorderedFriends;
        });
        fetchUser();
      };
      
    useEffect(() => {
        // fetchFreinds();
      
        // Connect socket and listen for updates
        socket.current = io(mainURL); // Assuming `mainURL` is your server's base URL
      
        // Register the user
        socket.current.emit("registerUser", userId);
      
        // Listen for pinnedChatsUpdated event
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
        
        // Clean up on component unmount
        return () => {
          socket.current.disconnect();
        };
      }, [userId]);
      
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

              <IconButton mb="4" variant="solid" bg="indigo.500" colorScheme="indigo" 
                  borderRadius="full" icon={<Icon as={Ionicons} size="6" name="people-sharp" 
                  _dark={{ color: "warmGray.50" }} color="warmGray.50" />} onPress={()=>navigation.navigate("FriendRequests")}/>
                    
              <IconButton mb="4" variant="solid" bg="yellow.400" colorScheme="yellow" 
                  borderRadius="full" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                  size="6" name="person-add" color="warmGray.50" />} onPress={()=>navigation.navigate("Home")}/>
                    
            </Stagger>
          </Box>
          <HStack position={"absolute"} alignSelf={"flex-end"} bottom={10} right={5} >
            {/* <Button title="Delete All Messages" onPress={deleteAllMessages} color="#ff0000" /> */}
            <IconButton variant="solid" borderRadius="full" size="lg" onPress={onToggle} bg="cyan.400" icon={<Icon as={MaterialCommunityIcons} size="6" name="dots-horizontal" color="warmGray.50" _dark={{ color: "warmGray.50" }} />} />
          </HStack>
        </>
    )
}

export default ChatScreen;