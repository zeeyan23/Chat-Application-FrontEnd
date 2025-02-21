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
    // Handle call accepted
    socket.current.on("video_call_approved", (data) => {
      setCallAccepted(true);
      navigation.replace("VideoCallScreen", {
        channelId: data.channelId,
        isHost: !isCalling, // Caller is host, recipient is audience
      });
    });

    // Handle call decline
    socket.current.on("video_call_declined", () => {
      Alert.alert("Call Declined");
      navigation.goBack();
    });

    return () => {
      socket.current.off("video_call_approved");
      socket.current.off("video_call_declined");
    };
  }, []);

  // Accept Call
  const acceptCall = () => {
    socket.current.emit("video_call_accepted", { callerId, recipientId });

    navigation.replace("VideoCallScreen", {
      channelId: callerId, // Using callerId as channelId
      isHost: false, // Recipient is audience
    });
  };

  // Decline Call
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
