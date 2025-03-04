import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import socketInstance from "../Utils/socket";
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Box, View } from "native-base";
import { Text } from "react-native";
import { ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { mainURL } from "../Utils/urls";
import CustomButton from "../components/CustomButton";
import { SafeAreaProvider } from "react-native-safe-area-context";

function VoiceScreen({route}){
    const { callerId, calleeId, isCaller, callerInfo, calleeInfo,isGroup, isCalling, groupId, recipientId, participants = [], callerImage, callerName } = route.params;
    const navigation = useNavigation();
    const [callAccepted, setCallAccepted] = useState(false);
    const socket = socketInstance.getSocket();

    console.log("VoiceScreen")
    let source, caller_image;
    if(callerImage){
      const baseUrl = `${mainURL}/files/`;
      const imageUrl= callerImage;
      const normalizedPath = imageUrl.replace(/\\/g, "/"); 
      const filename=normalizedPath.split("/").pop();
      source = {uri: baseUrl + filename}
    }

    if(callerInfo && callerInfo.image){
      const baseUrl = `${mainURL}/files/`;
      const imageUrl= callerInfo.image;
      const normalizedPath = imageUrl.replace(/\\/g, "/"); 
      const filename=normalizedPath.split("/").pop();
      caller_image = {uri: baseUrl + filename}
    }
    useEffect(()=>{
      const handleCallApproved = (data) => {
        if (!callAccepted) {
          setCallAccepted(true);
          navigation.replace("VoiceCallScreen", {
            callerId: data.callerId,
            calleeId: data.calleeId,
            isCaller: data.isCaller,
            callerInfo: data.callerInfo,
            calleeInfo: data.calleeInfo,
          });
        }
      }

        socket.on("voice_call_approved", handleCallApproved);
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
            Alert.alert(
              "Call Ended",
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(), 
                },
              ]
            );
          });

        // const handleCallEnded = () => {
        //   Alert.alert("Call Ended", "The other user has left the call.");
        //   navigation.goBack();
        // };
          const handleCallDeclined = () => {
            Alert.alert("Call Declined");
            navigation.goBack();
          };
    
          socket.off("voice_call_declined").on("voice_call_declined", handleCallDeclined);
         
          return () => {
            socket.off("voice_call_declined", handleCallDeclined);
            // socket.off("call_ended", handleCallEnded);
            socket.off("voice_call_approved", handleCallApproved);
          };
    },[callAccepted, navigation])

    const acceptCall = () => {
      if(isGroup){
        socket.emit("group_voice_call_accepted", { groupId, callerId, recipientId, participants: [...participants, recipientId], });
        navigation.replace("VoiceCallScreen", {
          channelId: groupId,
          isHost: false,
          isGroup: true,
        });
      }else{
        if (!callAccepted) {
          setCallAccepted(true);
          socket.emit("voice_call_accepted", { callerId, calleeId });
          navigation.replace("VoiceCallScreen", {
            callerId: callerId, 
            calleeId: calleeId,
            isCaller: false,
            callerInfo: callerInfo,
            calleeInfo: calleeInfo,
          });
        }
      }
        
    };
      
    const declineCall = (calleeId, groupId) => {
        if(isGroup){
          socket.emit("decline_group_voice_call", { callerId, groupId });
          navigation.goBack();
        }else{
          socket.emit("decline_voice_call", { calleeId });
          navigation.goBack();
        }
    };

    const renderDialComponent = () =>{
      return(
        <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
          <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
              <Box maxW="96" rounded="full">
                <MaterialCommunityIcons name="account" size={100} color="gray" />
              </Box>
              <Text>Waiting for to connect...</Text>
          </Box>
          <Box flex={1} justifyContent="flex-end" padding={10}>
              <Box flexDirection={"row"} justifyContent={"center"}>
                  <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={() => declineCall(calleeId, isGroup && groupId)}/>
              </Box>
          </Box>
        </Box>
      )
    }

    const renderDialGroupComponent = () =>{
      return(
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
      )
    }

    const renderReceiverComponent = () =>{
      return(
        <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
          <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
              <Box maxW="96" rounded="full">
                  {caller_image ? (
                      <Avatar size="2xl" source={caller_image} />
                  ) : (
                      <Ionicons name="person-circle-outline" size={100} color="gray" />
                  )}
              </Box>
              <Text style={{color:"black"}}>{callerInfo?.user_name}</Text>
              <Text>Calling you...</Text>
          </Box>
          <Box flex={1} justifyContent="flex-end" padding={10}>
              <Box flexDirection={"row"} justifyContent={"space-between"}>
                  <CustomButton iconName={"call-outline"} bgColor="green.700" onPress={acceptCall}/>
                  <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={()=>declineCall(callerId)}/>
              </Box>
          </Box>
        </Box>
      )
    }

    const renderReceiverGroupComponent = () =>{
      return(
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
        </Box>
      )
    }

    return(
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
          {isCaller && !isGroup && renderDialComponent()}
          {isCaller && isGroup && renderDialGroupComponent()}

          {!isCaller && !isGroup && renderReceiverComponent()}
          {!isCaller && isGroup && renderReceiverGroupComponent()}
        </SafeAreaView>
      </SafeAreaProvider>
    )
}


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
})
export default VoiceScreen;