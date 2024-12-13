import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import {  Text, View } from "react-native";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import { Avatar, Box, FlatList, HStack, Pressable, Spacer, VStack } from "native-base";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

function ChatScreen(){

    const [friendsData, setFriendsData]=useState([]);
    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();
    useEffect(()=>{
        fetchFreinds();
    },[]);

    const fetchFreinds= async()=>{
        try {
            const response = await axios.get(
                `${mainURL}/get-all-friends/${userId}`).then((res)=>{
                    if(res.status ===200){
                        

                        setFriendsData(res.data);
                        
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

    console.log(friendsData)

    return(
        <Box flex={1} backgroundColor={"white"}>
            <FlatList data={friendsData} renderItem={({item}) =><Pressable onPress={()=>navigation.navigate("MessageScreen" ,{userName: item.user_name, recipentId: item._id}) }>
                {({ isHovered,  isFocused,  isPressed }) => {
                    return <Box borderBottomWidth="1" _dark={{ borderColor: "muted.50" }} 
                                borderColor="muted.200" pl={["2", "4"]} pr={["2", "5"]} py="2" 
                                bg={isPressed ? 'coolGray.200' : isHovered ? 'coolGray.200' : 'coolGray.100'} 
                                style={{ transform: [{ scale: isPressed ? 0.96 : 1 }] }}>
                                <HStack space={[2, 3]} justifyContent="space-between">
                                    <Avatar size="48px" source={{ uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" }} />
                                    <VStack alignSelf={"center"}>
                                        <Text fontSize="lg" color="black" style={{fontWeight:"bold"}}>{item.user_name}</Text>
                                    </VStack>
                                    <Spacer />  
                                </HStack>
                            </Box>;
                    }}
                    </Pressable> } keyExtractor={item => item._id}
            />
        </Box>
    )
}

export default ChatScreen;