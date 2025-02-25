import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import socketInstance from "../Utils/socket";
import { Alert, TouchableOpacity } from "react-native";
import { View } from "native-base";
import { Text } from "react-native";

function VoiceScreen({route}){
    const { isCalling, recipientId, callerId, callerName, callerImage } = route.params;
    const navigation = useNavigation();
    const [callAccepted, setCallAccepted] = useState(false);
    const socket = socketInstance.getSocket();

    useEffect(()=>{
        socket.on("voice_call_approved", (data) => {
            setCallAccepted(true);
            navigation.replace("VoiceCallScreen", {
              channelId: data.channelId,
              isHost: !isCalling, 
            });
          });

        socket.on("voice_call_declined", () => {
            Alert.alert("Call Declined");
            navigation.goBack();
        });
        
    },[])

    const acceptCall = () => {
        socket.emit("voice_call_accepted", { callerId, recipientId });
    
        navigation.replace("VoiceCallScreen", {
          channelId: callerId, 
          isHost: false, 
        });
    };
      
    const declineCall = () => {
        socket.emit("decline_voice_call", { callerId });
        navigation.goBack();
    };

    return(
        <View style={{flex:1}}>
              {isCalling ? (
                <Text>Waiting for recipient to accept...</Text>
              ) : (
                <View >
                  <Text>{callerName} is calling...</Text>
                  <TouchableOpacity onPress={acceptCall}>
                    <Text>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={declineCall}>
                    <Text>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
        </View>
    )
}

export default VoiceScreen;