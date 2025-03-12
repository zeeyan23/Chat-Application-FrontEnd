import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { mainURL } from "../Utils/urls";
import { useContext } from "react";
import { UserType } from "../Context/UserContext";
import { Box, FlatList, Heading, Avatar, HStack, VStack, Text, Spacer, Center, NativeBaseProvider, Button } from "native-base";
import { useNavigation } from "@react-navigation/native";
import Ionicons from '@expo/vector-icons/Ionicons';
function FriendsScreen(){

    const [friendRequestsData, setFriendRequestsData] = useState([]);

    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();

    useEffect(()=>{
        fetchFreindRequests();
    },[]);
    
    const fetchFreindRequests= async()=>{
        try {
            const response = await axios.get(
                `${mainURL}/friend/get-friend-request/${userId}`).then((res)=>{
                    if(res.status ===200){
                        const friendRequestsData = res.data.map((friendRequest)=>{
                            return{
                                _id: friendRequest._id,
                                user_name: friendRequest.user_name,
                                email: friendRequest.email,
                            }
                        })

                        setFriendRequestsData(friendRequestsData);
                    }
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
        } catch (error) {
            
        }
    }

    const handleAcceptFreindRequests= async(senderId)=>{
       
        const data={senderId : senderId, recepientId: userId}
        try {
            const response = await axios.post(
                `${mainURL}/friend/accept-friend-request/accept`, data).then((res)=>{
                    setFriendRequestsData(friendRequestsData.filter((request)=> request._id !==senderId));
                    navigation.navigate("Chats");
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
    
    console.log(friendRequestsData)
    return(
        <Box flex={1} backgroundColor={"black"}>
            <FlatList data={friendRequestsData} renderItem={({item}) => {
                const baseUrl = `${mainURL}/files/`;
                const imageUrl = item.image;
                const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                const filename = normalizedPath.split('/').pop();

                const source = item.image 
                    ? { uri: baseUrl + filename } 
                    : null;
                return(
                    <Box borderBottomWidth="1" _dark={{ borderColor: "muted.50" }} borderColor="muted.400" pl={["2", "4"]} pr={["2", "5"]} py="2">
                        <HStack space={[2, 3]} justifyContent="space-between">
                        {source ? <Avatar size="48px" source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                        <VStack alignSelf={"center"}>
                            <Text fontSize="lg" color="white" style={{fontWeight:"bold"}}>{item.user_name}</Text>
                            
                        </VStack>
                        <Spacer />
                        <Box alignSelf={"center"}>
                            <Button size={"sm"} onPress={()=>handleAcceptFreindRequests(item._id)}>Accept</Button>
                        </Box>
                        </HStack>
                    </Box>)}} keyExtractor={item => item._id} 
                    ListEmptyComponent={
                        <Box alignItems="center" justifyContent="center" mt="10">
                            <Text fontSize="lg" color="gray.500">
                                No friend requests yet
                            </Text>
                        </Box>
                    }
                />
        </Box>
    )
}

export default FriendsScreen;