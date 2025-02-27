import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import socketInstance from "../Utils/socket";
import { Alert, TouchableOpacity } from "react-native";
import { Avatar, Box, View } from "native-base";
import { Text } from "react-native";
import { ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { mainURL } from "../Utils/urls";
import CustomButton from "../components/CustomButton";

function VoiceScreen({route}){
    const { isCalling, groupId,recipientId, isGroup,callerId, participants = [], callerImage, callerName } = route.params;
    const navigation = useNavigation();
    const [callAccepted, setCallAccepted] = useState(false);
    const socket = socketInstance.getSocket();

    let source;
    if(callerImage){
      const baseUrl = `${mainURL}/files/`;
      const imageUrl= callerImage;
      const normalizedPath = imageUrl.replace(/\\/g, "/"); 
      const filename=normalizedPath.split("/").pop();
      source = {uri: baseUrl + filename}
    }

    useEffect(()=>{
        socket.on("voice_call_approved", (data) => {
            setCallAccepted(true);
            navigation.replace("VoiceCallScreen", {
              channelId: data.channelId,
              isHost: !isCalling, 
            });
          });

        socket.on("group_voice_call_approved", (data) => {
            setCallAccepted(true);
            navigation.replace("VoiceCallScreen", {
              channelId: data.channelId,
              participants: data.participants,
              isHost: !isCalling,
              isGroup: true,
              callerId: callerId
            });
        });

          socket.on("group_voice_call_declined", (data) => {
            console.log("Decline event received: ", data);
            Alert.alert(
              "Call Ended", data.message,
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(), 
                },
              ]
            );
          });
        socket.on("voice_call_declined", () => {
            Alert.alert("Call Declined");
            navigation.goBack();
        });
        
    },[])

    const acceptCall = () => {
      if(isGroup){
        socket.emit("group_voice_call_accepted", { groupId, callerId, recipientId, participants: [...participants, recipientId], });
        navigation.replace("VoiceCallScreen", {
          channelId: groupId,
          isHost: false,
          isGroup: true,
        });
      }else{
        socket.emit("voice_call_accepted", { callerId, recipientId });
    
        navigation.replace("VoiceCallScreen", {
          channelId: callerId, 
          isHost: false, 
        });
      }
        
    };
      
    const declineCall = (callerId, groupId) => {
        if(isGroup){
          socket.emit("decline_group_voice_call", { callerId, groupId });
          navigation.goBack();
        }else{
          console.log("one to one call")
          socket.emit("decline_voice_call", { callerId });
          navigation.goBack();
        }
    };

    return(
        <View style={{flex:1}}>
              {isCalling ? (
                <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
                <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                    <Box maxW="96" rounded="full">
                      <MaterialCommunityIcons name="account-group" size={100} color="gray" />
                    </Box>
                    <Text>Waiting for participants to connect...</Text>
                </Box>
                <Box flex={1} justifyContent="flex-end" padding={10}>
                    <Box flexDirection={"row"} justifyContent={"center"}>
                        <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={()=>declineCall(callerId, groupId)}/>
                    </Box>
                </Box>
              </Box>
              
              ) : (
                <>
                {!isGroup ? 
                <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
                  <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                      <Box maxW="96" rounded="full">
                          {source ? (
                              <Avatar size="2xl" source={source} />
                          ) : (
                              <Ionicons name="person-circle-outline" size={100} color="gray" />
                          )}
                      </Box>
                      <Text style={{color:"black"}}>{callerName}</Text>
                      <Text>Calling you...</Text>
                  </Box>
                  <Box flex={1} justifyContent="flex-end" padding={10}>
                      <Box flexDirection={"row"} justifyContent={"space-between"}>
                          <CustomButton iconName={"call-outline"} bgColor="green.700" onPress={acceptCall}/>
                          <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={()=>declineCall(callerId)}/>
                      </Box>
                  </Box>
                </Box>
                  : 
                  <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
                    <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                        <Box maxW="96" rounded="full">
                            {source ? (
                                <Avatar size="2xl" source={source} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={100} color="gray" />
                            )}
                        </Box>
                        <Text style={{color:"black"}}>{callerName}</Text>
                        <Text>Initing you to a group voice call...</Text>
                    </Box>
                    <Box flex={1} justifyContent="flex-end" padding={10}>
                        <Box flexDirection={"row"} justifyContent={"space-between"}>
                            <CustomButton iconName={"call-outline"} bgColor="green.700" onPress={acceptCall}/>
                            <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={()=>declineCall(callerId)}/>
                        </Box>
                    </Box>
                  </Box>} 
                </>
              )}
        </View>
    )
}

export default VoiceScreen;