import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import { mainURL } from "../Utils/urls";


const VideoScreen = ({ route }) => {
  const { isCalling, recipientId, callerId, callerName, callerImage } = route.params;
  const navigation = useNavigation();
  const [callAccepted, setCallAccepted] = useState(false);
  const socket = useRef();

  socket.current = io(mainURL);
    useEffect(() => {
      socket.current.on("video_call_approved", (data) => {
        setCallAccepted(true);
        navigation.replace("VideoCallScreen", {
          channelId: data.channelId,
          isHost: !isCalling, 
        });
      });

      socket.current.on("video_call_declined", () => {
        Alert.alert("Call Declined");
        navigation.goBack();
      });

      return () => {
        socket.current.off("video_call_approved");
        socket.current.off("video_call_declined");
      };
  }, []);

  const acceptCall = () => {
    socket.current.emit("video_call_accepted", { callerId, recipientId });

    navigation.replace("VideoCallScreen", {
      channelId: callerId, 
      isHost: false, 
    });
  };

  const declineCall = () => {
    socket.current.emit("decline_video_call", { callerId });
    navigation.goBack();
  };

  return (
    <View>
      {isCalling ? (
        <Text>Waiting for recipient to accept...</Text>
      ) : (
        <View>
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
  );
};

export default VideoScreen;
