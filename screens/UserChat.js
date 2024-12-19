import { useNavigation } from "@react-navigation/native";
import { Avatar, Box, FlatList, HStack, Spacer, Text, VStack } from "native-base";
import { Pressable } from "react-native";
import { mainURL } from "../Utils/urls";
import { useContext, useEffect, useState } from "react";
import { UserType } from "../Context/UserContext";
import axios from "axios";

function UserChat({ item }) {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const [messages, setMessages]=useState([]);

  const fetchMessages = async()=>{
      try {
          const response = await axios.get(`${mainURL}/get-messages/${userId}/${item._id}`).then((res)=>{
              // const messages = res.data.message;
              // setMessages(messages);

              const messages = res.data.message.filter(
                (message) => !message.clearedBy.includes(userId)
              );
              setMessages(messages);
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

  useEffect(()=>{
      fetchMessages();
  },[])
  
  const getLastMessage = () =>{
    const userMessage = messages.filter((message) => message.messageType==='text')
    const n = userMessage.length;
    return userMessage[n-1];
  }

  const lastMessage = getLastMessage();

  function formatTime(time){
    const options= {hour: "numeric", minute:"numeric"}
    return new Date(time).toLocaleString("en-US",options)
  } 
  return (
    <Box flex={1} backgroundColor="white">
      <Pressable
        onPress={() =>
          navigation.navigate("MessageScreen", {
            userName: item.user_name,
            recipentId: item._id,
          })
        }
      >
        {({ isHovered, isFocused, isPressed }) => (
          <Box
            borderBottomWidth="1"
            _dark={{ borderColor: "muted.50" }}
            borderColor="muted.200"
            pl={["2", "4"]}
            pr={["2", "5"]}
            py="2"
            bg={isPressed ? "coolGray.200" : isHovered ? "coolGray.200" : "coolGray.100"}
            style={{ transform: [{ scale: isPressed ? 0.96 : 1 }] }}
          >
            <HStack space={[2, 3]} justifyContent="space-between">
              <Avatar size="48px" source={{ uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" }} />
              <VStack alignSelf="center">
                <Text fontSize="md" color="black" style={{ fontWeight: "bold" }}>{item?.user_name}</Text>
                {lastMessage && (
                    <Text style={{ marginTop: 3, color: "gray", fontWeight: "500" }}>
                        {lastMessage?.message}
                    </Text>
                )}
              </VStack>
              <Spacer />
              <Text>
                {lastMessage && formatTime(lastMessage?.timeStamp)}
              </Text>
            </HStack>
          </Box>
        )}
      </Pressable>
    </Box>
  );
}

export default UserChat;
