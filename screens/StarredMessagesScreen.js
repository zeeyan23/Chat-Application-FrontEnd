import { Avatar, Box, Center, FlatList, Flex, HStack, Pressable, Spacer, Text, VStack } from "native-base";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import Entypo from '@expo/vector-icons/Entypo';
import { Image, Modal, StyleSheet, View } from "react-native";
import { ResizeMode, Video } from 'expo-av';

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
            // setStarredMessages(response.data);
            const messages = response.data.filter(
                (message) => !message.clearedBy.includes(userId)
              );
              setStarredMessages(messages);
        }
        fetchStarredMessages();
    },[]);

    // console.log(JSON.stringify(starredMessages, null, 2));

    function formatTime(time){
        const options= {hour: "numeric", minute:"numeric"}
        return new Date(time).toLocaleString("en-US",options)
    } 

      const formatDuration = (durationInSeconds) => {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        return minutes > 0 
            ? `${minutes} min ${seconds} sec`
            : `${seconds} sec`;
      };
    return(
        <Box flex={1} background={"white"}>
            <FlatList
                data={starredMessages}
                renderItem={({ item }) => {
                    let source;
                        if (item.messageType === "image" && item.imageUrl) {
                        const baseUrl = `${mainURL}/files/`;
                        const imageUrl = item.imageUrl;
                        const normalizedPath = imageUrl.replace(/\\/g, "/");
                        const filename = normalizedPath.split("/").pop();
                        source = { uri: baseUrl + filename };
                        }
                        else if (item.messageType === "video" && item.videoUrl) {
                            const baseUrl = `${mainURL}/files/`;
                            const videoUrl = item.videoUrl;
                            const normalizedPath = videoUrl.replace(/\\/g, "/");
                            const filename = normalizedPath.split("/").pop();
                            source = { uri: baseUrl + filename };
                        }
                    return(
                    <Pressable
                    onPress={() => {
                        navigation.navigate("MessageScreen", {
                            recipentId: item.recepientId._id === item.starredBy[0]._id ? item.senderId._id : item.recepientId._id,
                            userName: item.senderId._id === item.starredBy[0]._id ? item.recepientId.user_name : item.senderId.user_name,
                            highlightedMessageId: item._id
                        });
                    }}>
                
                <Box pl={["4", "4"]} pr={["4", "5"]} py="5">
                    <HStack justifyContent="space-between" alignItems="center" width="100%">
                    <VStack flexDirection="row" space={1}>
                        <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                            {item.senderId._id === item.starredBy[0]._id
                            ? `${item.senderId.user_name} `
                            : `${item.senderId.user_name} `}
                        </Text>
                        <Entypo name="arrow-bold-right" style={{ top: 5 }} size={15} color="black" />
                        <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                            {item.senderId._id === item.starredBy[0]._id
                            ? `${item.recepientId.user_name}`
                            : `${item.starredBy[0].user_name}`}
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
                        {item.messageType==='image' && source ? (
                            <Image source={source} style={{width:200, height:200, borderRadius:7}} onError={(error) => console.log("Image Load Error:", error)}/>
                        ) : item.messageType === "video" && source ? (
                            <>
                            <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.videoName}</Text>
                            <Box flexDirection={"row"} justifyContent={"space-between"}>
                              <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
                              <Text style={styles.infoText}>{formatTime(item.timeStamp)}</Text>
                            </Box>
                            </>
                          ) : <Box background="#29F200"  padding={2}   borderRadius={8}   alignSelf="flex-start" marginTop={2}>
                          <Text color="coolGray.600" _dark={{ color: "warmGray.200" }}>
                            {item.message || item.fileName}
                          </Text>
                        </Box>}
                </Box>
                </Pressable>
                )}}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={
                    <Box alignItems="center" justifyContent="center" mt="10">
                        <Text fontSize="lg" color="gray.500">
                            Starred mssages appear here
                        </Text>
                    </Box>
                }
            />
            
        </Box>

    )
}

const styles= StyleSheet.create({
    infoText: {
        fontSize: 10,
        textAlign:'right',
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 10, // Add spacing between duration and timestamp
      },
})
export default StarredMessagesScreen;