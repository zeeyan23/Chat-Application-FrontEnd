


import React, { useRef, useState, useEffect, useContext } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Switch,
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    RtcConnection,
    IRtcEngineEventHandler,
    VideoSourceType,
} from 'react-native-agora';
import { mainURL } from '../Utils/urls';
import { UserType } from '../Context/UserContext';
import { Center, FlatList, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

const appId = '77de8ca3881e4be1a07052447ee4cb51';
const token = '007eJxTYEjnUe5+62d3+nTN/zOVrQvrAhYneXE843A5fkAlQbbi4mQFBnPzlFSL5ERjCwvDVJOkVMNEA3MDUyMTE/PUVJPkJFNDlbeH0xsCGRmYA8xZGRkgEMTnYijLTEnNj09OzMlhYAAA+Z0g/w==';
const channelName = 'video_call';
const localUid = 0;

const VideoCallScreen = ({ route, navigation }) => {
    const { callerId, calleeId, isCaller, callerInfo, calleeInfo,isGroup, participants = [], } = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');
    const eventHandler = useRef(null);
    const baseUrl = `${mainURL}/files/`;
    const socket = socketInstance.getSocket();
    const {userId, setUserId} = useContext(UserType);

    useEffect(() => {
        const init = async () => {
            await setupVideoSDKEngine();
            setupEventHandler();
            joinChannel();
        };
        init();
        return cleanupAgoraEngine;
    }, []);

    const getImageUri = (imagePath) => {
        if (!imagePath) return null; // Return null if no image path
        const baseUrl = `${mainURL}/files/`;
        const normalizedPath = imagePath.replace(/\\/g, "/");
        const filename = normalizedPath.split("/").pop();
        return { uri: baseUrl + filename };
    };

    const caller_image = getImageUri(callerInfo?.image);
    const callee_image = getImageUri(calleeInfo?.image);

    useEffect(() => {
        const handleCallEnded = () => {
            Alert.alert("Call Ended");
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate("Chats"); // Fallback if no screen to go back to
            }
        
        };
        
        socket.on("video_call_ended", handleCallEnded);
        
        return () => {
            socket.off("video_call_ended", handleCallEnded);
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
                setupLocalVideo();
                setIsJoined(true);
            },
            onUserJoined: (_connection, uid) => {
                setMessage(`Remote user ${uid} joined`);
                setRemoteUid(uid);
                agoraEngineRef.current?.muteRemoteVideoStream(uid, false);
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
            agoraEngineRef.current?.enableDualStreamMode(false);

        } catch (e) {
            console.error(e);
        }
    };

    const setupLocalVideo = () => {
        agoraEngineRef.current?.enableVideo();
        agoraEngineRef.current?.startPreview();
    };

    const joinChannel = async () => {
        if (isJoined) return;
        agoraEngineRef.current?.enableVideo();
        agoraEngineRef.current?.startPreview();
        try {
            agoraEngineRef.current?.joinChannel(token, channelName, 0, {
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
                //clientRoleType: isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
                clientRoleType: isCaller ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleBroadcaster, // Ensure both are broadcasters
                publishMicrophoneTrack: true,
                publishCameraTrack: true,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
        } catch (e) {
            console.log(e);
        }
    };

    const leaveChannel = () => {
        try {
            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            setMessage('Left the channel');
            socket.emit("leave_video_call", { calleeId: calleeId, callerId: callerId });
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


    return (
        <SafeAreaView style={styles.container}>
            {/* Remote User Camera (Full Screen) */}
            {isJoined &&  (
                <>
                <RtcSurfaceView
                    canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
                    style={styles.remoteVideo}
                />
                <View style={styles.localVideoContainer}>
                    <RtcSurfaceView
                        canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
                        style={styles.localVideo}
                    />
                </View>
                </>
                
            )}

           

            {/* Floating Leave Button */}
            <TouchableOpacity onPress={leaveChannel} style={styles.leaveButton}>
                <Text style={styles.leaveButtonText}>Leave Call</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

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
});


const getPermission = async () => {
    if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
    }
};

export default VideoCallScreen;