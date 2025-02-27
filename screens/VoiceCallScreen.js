import { useEffect, useRef, useState } from "react";
import { Image, ScrollView } from "react-native";
import { PermissionsAndroid, Platform, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
  } from 'react-native-agora';
import { mainURL } from "../Utils/urls";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Box, Center, Flex, Row, VStack, Wrap,Text, FlatList } from "native-base";
import CustomButton from "../components/CustomButton";
import socketInstance from "../Utils/socket";

const appId = 'b1b769d4b203413881261d9f64b00d47';
const token = '007eJxTYODdcKu3ySDi/uod64TPpP2KD5KRz15fGLSX8VLb70/z115VYEgyTDI3s0wxSTIyMDYxNLawMDQyM0yxTDMzSTIwSDExj/61P70hkJFhtuByVkYGCATxuRjK8jOTU+OTE3NyGBgAgMojGw==';
const channelName = 'voice_call';
const uid = 0;

function VoiceCallScreen({ route, navigation }){
    const { channelId, isHost, isGroup, participants = [], callerName, callerImage } = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');
    const eventHandler = useRef(null);
    const baseUrl = `${mainURL}/files/`;
    const socket = socketInstance.getSocket();

    useEffect(() => {
        const init = async () => {
            await setupVideoSDKEngine();
            setupEventHandler();
            joinChannel();
        };
        init();
        return cleanupAgoraEngine;
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

        try {
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
            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            setMessage('Left the channel');
            socket.emit("decline_group_voice_call", { callerId });
            navigation.goBack();
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

    //   const renderCallerInfo = () => (
    //     <VStack alignItems="center" space={2} my={3}>
    //       <Center size={24} rounded="full" overflow="hidden" bg="gray.700" shadow={4}>
    //         {callerImage ? (
    //           <Image source={getImageSource(callerImage)} style={{ width: 96, height: 96, borderRadius: 48 }} />
    //         ) : (
    //           <Ionicons name="person-circle" size={96} color="gray" />
    //         )}
    //       </Center>
    //       <Text color="white" fontSize="md" bold>{callerName || "Unknown User"}</Text>
    //     </VStack>
    //   );
      

    return(
        <>
            <SafeAreaView style={styles.container}>
                  
            {isGroup && renderParticipants()}
            {/* {!isGroup && renderCallerInfo()} */}

                {/* Floating Leave Button */}
                {/* <TouchableOpacity onPress={leaveChannel} style={styles.leaveButton}>
                    <Text style={styles.leaveButtonText}>Leave Call</Text>
                </TouchableOpacity> */}
                <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={leaveChannel}/>
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