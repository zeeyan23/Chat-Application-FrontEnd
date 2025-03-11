import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import { mainURL } from "../Utils/urls";
import socketInstance from "../Utils/socket";
import { Avatar, Box } from "native-base";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";

const VideoScreen = ({ route }) => {
  const { callerId, calleeId, isCaller, callerInfo, calleeInfo,isGroup, groupId, recipientId, participants = [], callerImage, callerName,memberId, userId } = route.params;
  const navigation = useNavigation();
  const [callAccepted, setCallAccepted] = useState(false);
  const socket = socketInstance.getSocket();

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
    useEffect(() => {
      const handleCallApproved = (data) => {
        if (!callAccepted) {
          setCallAccepted(true);
          navigation.replace("VideoCallScreen", {
            callerId: data.callerId,
            calleeId: data.calleeId,
            isCaller: data.isCaller,
            callerInfo: data.callerInfo,
            calleeInfo: data.calleeInfo,
          });
        }
      }

      socket.on("video_call_approved", handleCallApproved);

      const handleCallDeclined = () => {
        Alert.alert("Call Declined");
        navigation.goBack();
      };

      socket.off("video_call_declined").on("video_call_declined", handleCallDeclined);

      socket.on("group_video_call_approved", (data) => {
        setCallAccepted(true);
        navigation.replace("VideoCallScreen", {
          channelId: data.channelId,
          participants: data.participants,
          isGroup: true,
          isCaller: !isCaller,
          isCaller:true,
          userId: userId
        });
    });

    socket.on("group_video_call_declined", (data) => {
      Alert.alert(
        "Call Ended",data.message,
      );

      navigation.goBack();
    });


      return () => {
        socket.off("video_call_declined", handleCallDeclined);
        socket.off("video_call_approved");
      
      };
  }, [callAccepted, navigation]);

  const acceptCall = () => {
    if(isGroup){
      socket.emit("group_video_call_accepted", { groupId, callerId, recipientId, participants: [...participants, recipientId], });
      navigation.replace("VideoCallScreen", {
        channelId: groupId,
        isCaller: false,
        isGroup: true,
        participants : participants,
        callerId: callerId,
        memberId: memberId
      });
    }else{
      if (!callAccepted) {
        setCallAccepted(true);
        socket.emit("video_call_accepted", { callerId, calleeId });
        navigation.replace("VideoCallScreen", {
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
      if(isCaller){
        socket.emit("decline_group_video_call", { userId : userId, participants: participants, isCaller: isCaller });
      }else{
        socket.emit("decline_group_video_call", { memberId : memberId, participants: participants, isCaller: isCaller });
      }
    }else{
      socket.emit("decline_video_call", { calleeId });
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
            <Text>Initing you to a group video call...</Text>
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

  return (
    <View style={{flex:1}}>
      {isCaller && !isGroup && renderDialComponent()}
      {isCaller && isGroup && renderDialGroupComponent()}

      {!isCaller && !isGroup && renderReceiverComponent()}
      {!isCaller && isGroup && renderReceiverGroupComponent()}
    </View>
  );
};

export default VideoScreen;
