import { Alert, StyleSheet, View } from "react-native";
import { Box, useDisclose, IconButton, Stagger, HStack, Icon, Center, NativeBaseProvider, Button, Pressable, Menu, HamburgerIcon, Input } from 'native-base';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useContext } from "react";
import { UserType } from "../Context/UserContext";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { jwtDecode } from "jwt-decode"
import  {io}  from "socket.io-client";
import {  FlatList, Heading, Avatar, VStack, Spacer,Text } from "native-base";
import Entypo from '@expo/vector-icons/Entypo';
import socketInstance from "../Utils/socket";
function HomeScreen(){

    const socket = socketInstance.getSocket();
    const { isOpen, onToggle} = useDisclose();
    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();

    const [requestSent, setRequestSent]=useState([]);
    const [data, setData]= useState([]);
    const [friendRequests, setFriendRequests]=useState([]);
    const [friendRequestsReceived, setFriendRequestsReceived]=useState([]);
    const [userFriends, setUserFriends]=useState([]);

    const [enableSearchInputBox, setEnableSearchInputBox]=useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle:"",
            headerLeft:()=>(
                <Box paddingLeft={4}>
                    <Text fontWeight={"bold"} fontSize={20} color={"white"}>Explore Connections</Text>
                </Box>
            ),
        })
    },[]);

    useEffect(() => {
        socket.emit("join", userId);
        socket.on("friendRequestReceived", (data) => {
            setFriendRequestsReceived((prev) => [
                ...prev,
                { _id: data.senderId, user_name: data.senderName },
            ]);
        });
    
        socket.on("friendRequestAccepted", (data) => {
            console.log("friendRequestAccepted",data)
            setUserFriends((prev) => [...prev, data.userId]);
        });

        return () => {
            socket.disconnect();
        };
    }, [userId]);

    
    useEffect(() => {
        const fetchUser = async () => {
            const token = await AsyncStorage.getItem("authToken");
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;
            setUserId(userId);
            const usersResponse = await axios.get(`${mainURL}/user/all_users/${userId}`);
            setData(usersResponse.data);

            const sentRequestsResponse = await axios.get(`${mainURL}/friend/friend-requests/sent/${userId}`);
            setFriendRequests(sentRequestsResponse.data);

            const sentRequestsReceivedResponse = await axios.get(`${mainURL}/friend/friend-requests/received/${userId}`);
            setFriendRequestsReceived(sentRequestsReceivedResponse.data);

            const friendsResponse = await axios.get(`${mainURL}/friend/friends/${userId}`);
            const flattenedFriends = friendsResponse.data.flat();
            setUserFriends(flattenedFriends);
        };

        fetchUser();
    }, []);

    const handleFriendRequest = async(recipent_id)=>{
        try {
        const data={currentUserId: userId, selectedUserId: recipent_id};
       
            const response = await axios.post(
                `${mainURL}/friend/friend-request/`, data).then((res)=>{
                    setRequestSent((prev) => [...prev, recipent_id]);
            })
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

    // const deleteAllMessages = async () => {
    //     try {
    //       const response = await axios.delete( `${mainURL}/api/messages`);
    //       Alert.alert('Success', response.data.message);
    //     } catch (error) {
    //       Alert.alert('Error', 'Failed to delete messages.');
    //       console.error(error);
    //     }
    //   };

    const openChatFriend = async(item) =>{
        const formData = {
            userId: userId,
            chatsTobeRemovedFromDeletedChat: item._id,
          };
        try {
            const response = await axios.delete(
                `${mainURL}/chat/remove_chat_from_deleted_chat/`, {data: formData})

            if (response.status === 200) {
                navigation.navigate("MessageScreen", {
                  userName: item.user_name,
                  recipentId: item._id,
                  userImage: item.image,
                });
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
            navigation.navigate("MessageScreen", {
                userName: item.user_name,
                recipentId: item._id,
                userImage: item.image,
            });
        }
        
    }

    function enableSearchInput(){
        if (isOpen) onToggle();
        setEnableSearchInputBox((prev) => !prev);
    }

    const handleSearch = (text) => {
        setSearchQuery(text);
        
        if (text.trim() === '') {
            setFilteredData([]); // Reset to full list if input is empty
            return;
        } else {
            const filtered = data.filter((item) =>
                item.user_name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredData(filtered);
        }
    };

    return(
        <Box style={styles.container}>
            {enableSearchInputBox && <Input variant="underlined" placeholder="Enter friend name" style={styles.inputBox} value={searchQuery}
            onChangeText={handleSearch}/>}
            <Box style={{ flex: 1, width: "100%" }}>
                <FlatList
                data={filteredData}
                renderItem={({ item }) => {
                    const baseUrl = `${mainURL}/files/`;
                    const imageUrl = item.image;
                    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                    const filename = normalizedPath.split('/').pop();

                    const source = item.image 
                        ? { uri: baseUrl + filename } 
                        : null;
                    return(
                    <Box borderBottomWidth="1" borderColor="muted.300" pl={["2", "4"]} pr={["2", "5"]} py="2">
                        <HStack space={[2, 3]} justifyContent="space-between">
                            {source ? <Avatar size="48px" source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                            <VStack alignSelf={"center"}>
                                <Text fontSize="lg" color="white" style={{fontWeight:"bold"}}>{item.user_name}</Text>
                            </VStack>
                            <Spacer />
                            <Box alignSelf={"center"}>
                            {userFriends.includes(item._id) ? (
                                <Pressable
                                    onPress={() => openChatFriend(item)}
                                    style={{
                                        backgroundColor: "#82CD47",
                                        padding: 10,
                                        width: 105,
                                        borderRadius: 6,
                                    }}
                                    >
                                    <Text style={{ textAlign: "center", color: "white" }}>Friends</Text>
                                </Pressable>
                            ) : requestSent.includes(item._id) || friendRequestsReceived.some((friend) => friend._id === item._id) || friendRequests.some((friend) => friend._id === item._id) ? (
                                <Pressable
                                style={{
                                    backgroundColor: "gray",
                                    padding: 10,
                                    width: 105,
                                    borderRadius: 6,
                                }}
                                >
                                <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
                                {friendRequestsReceived.some((friend) => friend._id === item._id)
                                ? "Request Received"
                                : "Request Sent"}
                                </Text>
                                </Pressable>
                            ) : (
                                <Pressable
                                onPress={() => handleFriendRequest( item._id)}
                                style={{
                                    backgroundColor: "#567189",
                                    padding: 10,
                                    borderRadius: 6,
                                    width: 105,
                                }}
                                >
                                <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
                                    Add Friend
                                </Text>
                                </Pressable>
                            )}
                            </Box>
                        </HStack>
                    </Box>)}} keyExtractor={(item) => item._id} 
                    // ListEmptyComponent={
                    // <Box alignItems="center" justifyContent="center" mt="10">
                    //     <Text fontSize="lg" color="gray.500">
                    //         You will find registered users here
                    //     </Text>
                    // </Box>}
                />
            </Box>

            <Box style={{ position: "absolute" }} alignSelf={"flex-end"} bottom={20} right={5} >
                <Stagger visible={isOpen} initial={{ opacity: 0, scale: 0, translateY: 34 }} 
                    animate={{ translateY: 0, scale: 1, opacity: 1, 
                    transition: { type: "spring", mass: 0.8, stagger: { offset: 30, reverse: true } } }} 
                    exit={{ translateY: 34, scale: 0.5, opacity: 0, transition: { duration: 100, 
                    stagger: { offset: 30, reverse: true } } }}>

                <Pressable onPress={enableSearchInput} mb={4} bg="green.500" colorScheme={"green"} borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"add-circle"} />}size={6} color="warmGray.50" />
                </Pressable>

                <Pressable onPress={()=>navigation.navigate("FriendRequests")} mb={4} bg="indigo.500" colorScheme="indigo"  borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"people-circle-sharp"} />}size={6} color="warmGray.50" />
                </Pressable>

                <Pressable onPress={()=>navigation.navigate("Chats")} mb={4} bg="yellow.400" colorScheme="yellow"  borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"chatbox"} />}size={6} color="warmGray.50" />
                </Pressable>                    
                </Stagger>
            </Box>
            <HStack position={"absolute"} alignSelf={"flex-end"} bottom={10} right={5} >
            {/* <Button title="Delete All Messages" onPress={deleteAllMessages} color="#ff0000" /> */}
                <IconButton variant="solid" borderRadius="full" size="lg" onPress={onToggle} bg="cyan.400" icon={<Icon as={MaterialCommunityIcons} size="6" name="dots-horizontal" color="warmGray.50" _dark={{ color: "warmGray.50" }} />} />
            </HStack>
        </Box>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal:4,
        backgroundColor:"black"
    },
    inputBox:{
        color:"white",
    }
})
export default HomeScreen;