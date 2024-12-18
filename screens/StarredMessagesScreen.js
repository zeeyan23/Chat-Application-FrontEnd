import { Avatar, Box, Center, FlatList, Flex, HStack, Pressable, Spacer, Text, VStack } from "native-base";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import Entypo from '@expo/vector-icons/Entypo';
import { View } from "react-native";

function StarredMessagesScreen({navigation}){

    const {userId, setUserId} = useContext(UserType);
    const [starredMessages, setStarredMessages]=useState([]);

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle:"Starred Messages"
        })
    },[]);

    useEffect(()=> {
        const fetchStarredMessages = async () => {
            
            const response = await axios.get(`${mainURL}/get-starred-messages/${userId}`);
            setStarredMessages(response.data);

        }
        fetchStarredMessages();
    },[]);

    console.log(JSON.stringify(starredMessages, null, 2));

    function formatTime(time){
        const options= {hour: "numeric", minute:"numeric"}
        return new Date(time).toLocaleString("en-US",options)
    } 


    return(
        <Box flex={1} background={"white"}>
            <FlatList
                data={starredMessages}
                renderItem={({ item }) => (
                    <Pressable
                    onPress={() => {
                        navigation.navigate("MessageScreen", {
                            recipentId: item.recepientId._id === item.starredBy._id ? item.senderId._id : item.recepientId._id,
                            userName: item.senderId._id === item.starredBy._id ? item.recepientId.user_name : item.senderId.user_name,
                        });
                    }}
                >
                
                <Box pl={["4", "4"]} pr={["4", "5"]} py="5">
                    <HStack justifyContent="space-between" alignItems="center" width="100%">
                    <VStack flexDirection="row" space={1}>
                        <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                            {item.senderId._id === item.starredBy._id
                            ? `${item.senderId.user_name} `
                            : `${item.senderId.user_name} `}
                        </Text>
                        <Entypo name="arrow-bold-right" style={{ top: 5 }} size={15} color="black" />
                        <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                            {item.senderId._id === item.starredBy._id
                            ? `${item.recepientId.user_name}`
                            : `${item.starredBy.user_name}`}
                        </Text>
                    </VStack>

                    <Text
                        fontSize="sm"
                        
                        color="black"
                        textAlign="right"
                    >
                        {formatTime(item.created_date)}
                    </Text>
                    </HStack>
                    <Box
                    background="#29F200"
                    padding={2}
                    borderRadius={8}
                    alignSelf="flex-start"
                    marginTop={2}
                    >
                    <Text color="coolGray.600" _dark={{ color: "warmGray.200" }}>
                        {item.message}
                    </Text>
                    </Box>
                </Box>
                </Pressable>
                )}
                keyExtractor={(item) => item._id}
            />
        </Box>

    )
}

export default StarredMessagesScreen;