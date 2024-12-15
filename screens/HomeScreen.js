import { StyleSheet, View } from "react-native";
import { Box, useDisclose, IconButton, Stagger, HStack, Icon, Center, NativeBaseProvider, Button, Pressable } from 'native-base';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useContext } from "react";
import { UserType } from "../Context/UserContext";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { jwtDecode } from "jwt-decode"
import {  FlatList, Heading, Avatar, VStack, Spacer,Text } from "native-base";

function HomeScreen(){

    const { isOpen, onToggle} = useDisclose();
    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();
    const [data, setData]= useState([]);
    const [requestSent, setRequestSent]=useState([]);
    const [friendRequests, setFriendRequests]=useState([]);
    const [userFriends, setUserFriends]=useState([]);

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle:"",
            headerLeft:()=>(
                <Text>Chat App</Text>
            ),
            headerRight:()=>(
                <View>
                    <SimpleLineIcons name="settings" size={24} color="black" />
                </View>
            )
        })
    },[]);

    useEffect(()=>{
        const fetchFriendRequests = async ()=>{
            
            try {
                const response = await axios.get(`${mainURL}/friend-requests/sent/${userId}`);
                setFriendRequests(response.data); // Use `response.data`
            } catch (error) {
                console.log("Error:", error);
                if (error.response) {
                    console.log("Server Error:", error.response.data);
                } else if (error.request) {
                    console.log("Network Error:", error.request);
                } else {
                    console.log("Other Error:", error.message);
                }
            }
        }

        fetchFriendRequests();
    },[userId]);

    useEffect(()=>{
        const fetchUserFriends = async ()=>{
            try {
                const response = await axios.get(`${mainURL}/friends/${userId}`);
                setUserFriends(response.data); // Use `response.data`
            } catch (error) {
                console.log("Error:", error);
                if (error.response) {
                    console.log("Server Error:", error.response.data);
                } else if (error.request) {
                    console.log("Network Error:", error.request);
                } else {
                    console.log("Other Error:", error.message);
                }
            }
        }

        fetchUserFriends();
    },[userId])

    useEffect(()=>{
        const fetchUsers = async ()=>{
            const token = await AsyncStorage.getItem("authToken");
            console.log("token", token)
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId;
            setUserId(userId);
            console.log(userId)
            const response = await axios.get(
                `${mainURL}/all_users/${userId}`).then((res)=>{
                    setData(res.data)
                }).catch((error)=>{
                    console.log('Error:', error); 
                    if (error.response) {
                        console.log('Server Error:', error.response.data); 
                    } else if (error.request) {
                        console.log('Network Error:', error.request); 
                    } else {
                        console.log('Other Error:', error.message); 
                    }
                })
        }

        fetchUsers();
    },[]);

    const handleFriendRequest = async(recipent_id)=>{
        try {
        const data={currentUserId: userId, selectedUserId: recipent_id};
        console.log(data)
        
            const response = await axios.post(
                `${mainURL}/friend-request/`, data).then((res)=>{
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

    return(
        <Box style={styles.container}>
            <Box style={{ flex: 1, width: "100%" }}>
                <FlatList
                data={data.users}
                renderItem={({ item }) => (
                    <Box borderBottomWidth="1" borderColor="muted.300" pl={["2", "4"]} pr={["2", "5"]} py="2">
                        <HStack space={[2, 3]} justifyContent="space-between">
                            <Avatar size="48px" source={{ uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" }} />
                            <VStack alignSelf={"center"}>
                                <Text fontSize="lg" color="black" style={{fontWeight:"bold"}}>{item.user_name}</Text>
                            </VStack>
                            <Spacer />
                            <Box alignSelf={"center"}>
                            {userFriends.includes(item._id) ? (
                                <Pressable
                                style={{
                                    backgroundColor: "#82CD47",
                                    padding: 10,
                                    width: 105,
                                    borderRadius: 6,
                                }}
                                >
                                <Text style={{ textAlign: "center", color: "white" }}>Friends</Text>
                                </Pressable>
                            ) : requestSent.includes(item._id) || friendRequests.some((friend) => friend._id === item._id) ? (
                                <Pressable
                                style={{
                                    backgroundColor: "gray",
                                    padding: 10,
                                    width: 105,
                                    borderRadius: 6,
                                }}
                                >
                                <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
                                    Request Sent
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
                    </Box>
                )}
                keyExtractor={(item) => item._id}
                />
            </Box>
            <Box style={{ position: "absolute" }} alignSelf={"flex-end"} bottom={20} right={5} >
                <Stagger visible={isOpen} initial={{ opacity: 0, scale: 0, translateY: 34 }} 
                    animate={{ translateY: 0, scale: 1, opacity: 1, 
                    transition: { type: "spring", mass: 0.8, stagger: { offset: 30, reverse: true } } }} 
                    exit={{ translateY: 34, scale: 0.5, opacity: 0, transition: { duration: 100, 
                    stagger: { offset: 30, reverse: true } } }}>

                <IconButton mb="4" variant="solid" bg="indigo.500" colorScheme="indigo" 
                    borderRadius="full" icon={<Icon as={Ionicons} size="6" name="people-circle-sharp" 
                    _dark={{ color: "warmGray.50" }} color="warmGray.50" />} onPress={()=>navigation.navigate("FriendRequests")}/>
                    
                <IconButton mb="4" variant="solid" bg="yellow.400" colorScheme="yellow" 
                    borderRadius="full" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                    size="6" name="chatbox" color="warmGray.50" />} onPress={()=>navigation.navigate("Chats")}/>
                    
                </Stagger>
            </Box>
            <HStack position={"absolute"} alignSelf={"flex-end"} bottom={10} right={5} >
                <IconButton variant="solid" borderRadius="full" size="lg" onPress={onToggle} bg="cyan.400" icon={<Icon as={MaterialCommunityIcons} size="6" name="dots-horizontal" color="warmGray.50" _dark={{ color: "warmGray.50" }} />} />
            </HStack>
        </Box>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:"white"
    }
})
export default HomeScreen;