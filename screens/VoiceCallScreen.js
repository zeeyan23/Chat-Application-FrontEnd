import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Image, ScrollView } from "react-native";
import { PermissionsAndroid, Platform, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
  } from 'react-native-agora';
import { mainURL } from "../Utils/urls";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Box, Center, Flex, Row, VStack, Wrap,Text, FlatList, Button, Icon } from "native-base";
import CustomButton from "../components/CustomButton";
import socketInstance from "../Utils/socket";
import { UserType } from "../Context/UserContext";
import axios from "axios";

const appId = 'bb4384dc3e7f4eba9d8b371263ac938e';
const channelName = 'voice_call';
const uid = 0;

function VoiceCallScreen({ route, navigation }){
    // const { channelId, recipientId,isHost, isGroup,  } = route.params;
    const { callerId, calleeId, isCaller, callerInfo, calleeInfo,isGroup,  participants: initialParticipants = [], memberId} = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');
    const [participants, setParticipants] = useState(initialParticipants);
    const eventHandler = useRef(null);
    const baseUrl = `${mainURL}/files/`;
    const socket = socketInstance.getSocket();
    const {userId, setUserId} = useContext(UserType);

    console.log("voice call screen",participants)

    useEffect(() => {
        const init = async () => {
            await setupVideoSDKEngine();
            setupEventHandler();
            joinChannel();
        };
        init();
        return cleanupAgoraEngine;
    }, []);

    // Helper function to normalize image paths
    const getImageUri = (imagePath) => {
        if (!imagePath) return null; // Return null if no image path
        const baseUrl = `${mainURL}/files/`;
        const normalizedPath = imagePath.replace(/\\/g, "/");
        const filename = normalizedPath.split("/").pop();
        return { uri: baseUrl + filename };
    };
  
  // Safely extract images
  const caller_image = getImageUri(callerInfo?.image);
  const callee_image = getImageUri(calleeInfo?.image);
  
    useEffect(() => {
        const handleCallEnded = () => {
            Alert.alert("Call Ended");
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate("Chats");
            }
    
        };

    
        socket.on("call_ended", handleCallEnded);
    
        const handleGroupCallEnded = (data) => {
            console.log("Received group_call_ended event:", data);
            Alert.alert("Call Ended", data.message);
            navigation.goBack();
          };
      
          socket.on("group_call_ended", handleGroupCallEnded);
          
        return () => {
            socket.off("call_ended", handleCallEnded);
            socket.off("group_call_ended",handleGroupCallEnded);
        };
    }, []);
    
    useEffect(() => {
        return () => {
          if (userId) {
            socketInstance.joinRoom(userId);
            console.log(`🔄 Rejoined room after call: ${userId}`);
          }
        };
      }, []);

      
    const setupEventHandler = () => {
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                setMessage(`Successfully joined channel: ${channelName}`);
                agoraEngineRef.current?.enableAudio(); 
                setIsJoined(true);
            },
            onUserJoined: (_connection, uid) => {
                setMessage(`Remote user ${uid} joined`);
                setRemoteUid(uid);
            },
            onUserOffline: (_connection, uid) => {
                setMessage(`Remote user ${uid} left the channel`);
                setRemoteUid(0);
                setParticipants((prevParticipants) => prevParticipants.filter((p) => p.id !== uid));
            
            },
        };
        agoraEngineRef.current?.registerEventHandler(eventHandler.current);
    };

    const setupVideoSDKEngine = async () => {
        try {
            if (Platform.OS === 'android') await getPermission();
            agoraEngineRef.current = createAgoraRtcEngine();
            await agoraEngineRef.current.initialize({ appId });
        } catch (e) {
            console.error(e);
        }
    };

    const joinChannel = async () => {
        if (isJoined) return;
        agoraEngineRef.current?.enableAudio();
        agoraEngineRef.current?.setDefaultAudioRouteToSpeakerphone(false); 
        agoraEngineRef.current?.muteLocalAudioStream(false);
        try {
            const response = await fetch(
                `${mainURL}/generate_voice_token?channelName=${channelName}&uid=${uid}`
              );
            const data = await response.json();
            console.log("data token",data.token)
            const token = data.token;
                agoraEngineRef.current?.joinChannel(token, channelName, uid, {
                    channelProfile: ChannelProfileType.ChannelProfileCommunication,
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                    publishMicrophoneTrack: true,
                    autoSubscribeAudio: true,
                });
        } catch (e) {
            console.log("Join error:", e);
        }
    };

    const leaveChannel = () => {
        try {
            if(isGroup){
                if(isCaller){
                    agoraEngineRef.current?.leaveChannel();
                    setRemoteUid(0);
                    setIsJoined(false);
                    socket.emit("leave_group_voice_call", {participants:participants, userId: userId, isCaller: isCaller});
                    console.log(userId)
                }else{
                    console.log(memberId)
                    agoraEngineRef.current?.leaveChannel();
                    setRemoteUid(0);
                    setIsJoined(false);
                    socket.emit("leave_group_voice_call", {participants:participants, memberId: memberId, isCaller: isCaller});
                }
                
            }else{
                agoraEngineRef.current?.leaveChannel();
                setRemoteUid(0);
                setIsJoined(false);
                setMessage('Left the channel');
                socket.emit("leave_voice_call", { calleeId: calleeId, callerId: callerId });
                navigation.goBack();
            }
        } catch (e) {
            console.log(e);
        }
    };

    const cleanupAgoraEngine = () => {
        return () => {
            agoraEngineRef.current?.unregisterEventHandler(eventHandler.current);
            agoraEngineRef.current?.release();
        };
    };

    const getImageSource = (userImage) => {
        if (!userImage) {
          return null;
        }
        const normalizedPath = userImage.replace(/\\/g, "/");
        const filename = normalizedPath.split("/").pop();
        return { uri: `${baseUrl}${filename}` };
      };

      
      const renderParticipants = () => (
        <FlatList
            data={participants}
            numColumns={2}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ justifyContent: "space-between", marginHorizontal: 16 }}
            contentContainerStyle={{ paddingVertical: 20 }}
            renderItem={({ item }) => (
            <VStack alignItems="center" space={2} my={3} mx={10}>
                <Center size={24} rounded="full" overflow="hidden" bg="gray.700" shadow={4}>
                {item.userImage ? (
                    <Image source={getImageSource(item.userImage)} style={{ width: 96, height: 96, borderRadius: 48 }} />
                ) : (
                    <Ionicons name="person-circle" size={96} color="gray" />
                )}
                </Center>
                <Text color="white" fontSize="md" bold>
                {item.userName || "Unknown User"}
                </Text>
            </VStack>
            )}
        />
      );

      const renderCallerInfo = () => (
        <VStack alignItems="center" space={2} my={3}>
            <Center size={24} rounded="full" overflow="hidden" bg="gray.700" shadow={4}>
                {caller_image ? (
                <Image source={caller_image} style={{ width: 96, height: 96, borderRadius: 48 }} />
                ) : (
                <Ionicons name="person-circle" size={96} color="gray" />
                )}
            </Center>
            <Text color="white" fontSize="md" bold>
                {callerInfo?.user_name || "Unknown Caller"}
            </Text>
        </VStack>
      );
      
      const renderCalleeInfo = () => (
        <VStack alignItems="center" space={2} my={3}>
            <Center size={24} rounded="full" overflow="hidden" bg="gray.700" shadow={4}>
                {callee_image ? (
                <Image source={callee_image} style={{ width: 96, height: 96, borderRadius: 48 }} />
                ) : (
                <Ionicons name="person-circle" size={96} color="gray" />
                )}
            </Center>
            <Text color="white" fontSize="md" bold>
                {calleeInfo?.user_name || "Unknown Callee"}
            </Text>
        </VStack>
      );

    return(
        <>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            {/* Caller/Callee Info at the Top */}
                <Box  top={10} left={0} right={0}>
                    {!isGroup && !isCaller && renderCallerInfo()}
                    {!isGroup && isCaller && renderCalleeInfo()}
                </Box>

                {/* Participants (If Group) */}
                {isGroup && renderParticipants()}

                {/* Button at the Bottom */}
                <Box position="absolute" bottom={10} left={0} right={0} alignItems="center">
                    <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={leaveChannel}/>
                </Box>
            </SafeAreaView>

        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    remoteVideo: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    leaveButton: {
        position: 'absolute',
        bottom: 30,
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    leaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        position: 'absolute',
        top: 10,
        backgroundColor: '#000',
        color: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        opacity: 0.8,
    },

    userContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      },
      avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
      },
      placeholderAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
        backgroundColor: "#ccc",
      },
      userName: {
        fontSize: 16,
        fontWeight: "500",
        color:"white"
      },
});


const getPermission = async () => {
    if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
    }
};

export default VoiceCallScreen;