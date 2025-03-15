


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
import { Box, Center, FlatList, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const appId = '77de8ca3881e4be1a07052447ee4cb51';
const token = '007eJxTYKitOL/y9IwJcl9X9X1ZuX/n5oCarAnbZ2TI83hevzO74+lpBQZz85RUi+REYwsLw1STpFTDRANzA1MjExPz1FST5CRTQ83Ki+kNgYwMn1+7MDMyQCCIz8VQlpmSmh+fnJiTw8AAAE93Ja0=';
const channelName = 'video_call';
const localUid = 0;

const VideoCallScreen = ({ route, navigation }) => {
    const { callerId, calleeId, isCaller,isGroup, participants = [] , memberId} = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUids, setRemoteUids] = useState([]);
    const [message, setMessage] = useState('');
    const eventHandler = useRef(null);
    const baseUrl = `${mainURL}/files/`;
    const socket = socketInstance.getSocket();
    const {userId, setUserId} = useContext(UserType);
    const [remoteUsers, setRemoteUsers] = useState([]);

    useEffect(() => {
        const init = async () => {
            await setupVideoSDKEngine();
            setupEventHandler();
            joinChannel();
        };
        init();
        return cleanupAgoraEngine;
    }, []);

    

    useEffect(() => {
        const handleCallEnded = () => {
            Alert.alert("Call Ended");
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate("Chats"); // Fallback if no screen to go back to
            }
        
        };

        const handleGroupCallEnded = (data) => {
            console.log("Received group_call_ended event:", data);
            Alert.alert("Call Ended", data.message);
            navigation.goBack();
          };
        
        socket.on("video_call_ended", handleCallEnded);
        socket.on("group_video_call_ended", handleGroupCallEnded);
        return () => {
            socket.off("video_call_ended", handleCallEnded);
            socket.off("group_video_call_ended",handleGroupCallEnded);
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
                //restartCamera();
                agoraEngineRef.current?.muteLocalVideoStream(false);
                agoraEngineRef.current?.muteLocalAudioStream(false);
            },
            onUserJoined: (_connection, uid) => {
                setMessage(`Remote user ${uid} joined`);
                // setRemoteUsers(prev => [...prev, uid]);
                setRemoteUids((prevUids) => [...new Set([...prevUids, uid])]);
                agoraEngineRef.current?.muteRemoteVideoStream(uid, false);
            },
            onUserOffline: (_connection, uid) => {
                setMessage(`Remote user ${uid} left the channel`);
                setRemoteUsers(prev => prev.filter(id => id !== uid));
                setRemoteUids((prevUids) => prevUids.filter((id) => id !== uid))
            },
        };
        agoraEngineRef.current?.registerEventHandler(eventHandler.current);
    };

    const setupVideoSDKEngine = async () => {
        try {
            const hasPermissions = await getPermission();
            if (!hasPermissions) {
                Alert.alert('Permissions Required', 'Camera and Microphone permissions are needed.');
                return;
            }
            if (!agoraEngineRef.current) {
                agoraEngineRef.current = createAgoraRtcEngine();
                await agoraEngineRef.current.initialize({ appId });
                agoraEngineRef.current.enableVideo();
                agoraEngineRef.current.enableDualStreamMode(false);
                agoraEngineRef.current.enableLocalVideo(true); 
                console.log('✅ Agora Engine Initialized');
            }

        } catch (e) {
            console.error(e);
        }
    };

    const restartCamera = async () => {
        try {
            if (agoraEngineRef.current) {
                console.log('🔄 Restarting local camera...');
                await agoraEngineRef.current.enableLocalVideo(false);
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay to reset
                await agoraEngineRef.current.enableLocalVideo(true);
                await agoraEngineRef.current.startPreview();
            }
        } catch (e) {
            console.error('❌ Error restarting camera:', e);
        }
    };

    
    const setupLocalVideo = async() => {
        try {
            if (agoraEngineRef.current) {
                console.log('📷 Enabling local video');
                await agoraEngineRef.current.enableLocalVideo(true);
                await agoraEngineRef.current.enableVideo();
                await agoraEngineRef.current.startPreview();
                agoraEngineRef.current.muteLocalVideoStream(false);  // Ensure video is not muted
            }
        } catch (e) {
            console.error('❌ Error setting up local video:', e);
        }
    };
    

    const joinChannel = async () => {
        if (isJoined) return;
        agoraEngineRef.current?.enableVideo();
        agoraEngineRef.current?.startPreview();
        try {
            agoraEngineRef.current?.joinChannel(token, channelName, localUid || 0, {
                channelProfile: isGroup ? ChannelProfileType.ChannelProfileLiveBroadcasting : ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
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
            if(isGroup){
                if(isCaller){
                    agoraEngineRef.current?.leaveChannel();
                    setRemoteUids([]);
                    setIsJoined(false);
                    socket.emit("leave_group_video_call", {participants:participants, userId: userId, isCaller: isCaller});
                    console.log(userId)
                }else{
                    console.log(memberId)
                    agoraEngineRef.current?.leaveChannel();
                    setRemoteUids([]);
                    setIsJoined(false);
                    socket.emit("leave_group_video_call", {participants:participants, memberId: memberId, isCaller: isCaller});
                }
            }else{
                agoraEngineRef.current?.leaveChannel();
                setRemoteUids([]);
                setIsJoined(false);
                setMessage('Left the channel');
                socket.emit("leave_video_call", { calleeId: calleeId, callerId: callerId });
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

    const renderParticipant = (uid) => {
        return (
            <Box style={styles.participantContainer} key={uid}>
                <RtcSurfaceView
                    canvas={{ uid, sourceType: VideoSourceType.VideoSourceRemote }}
                    style={styles.remoteVideo}
                />
            </Box>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
        <Box style={styles.videoContainer}>
            {isGroup ? (
                // Grid layout for group participants
                <>
                <Box>
                <FlatList
                            data={remoteUids}
                            keyExtractor={(uid) => uid.toString()}
                            renderItem={({ item: uid }) => (
                                <RtcSurfaceView
                                    canvas={{ uid, sourceType: VideoSourceType.VideoSourceRemote }}
                                    style={styles.remoteVideoBox}
                                />
                            )}
                            numColumns={2}
                        />
                        {remoteUids.map(uid => (
                        <RtcSurfaceView
                        key={uid}
                        canvas={{ localUid: userId, sourceType: VideoSourceType.VideoSourceCamera }}
                        style={styles.fullScreenVideo}
                        />
                    ))}
                </Box>
                    
                    </>
            ) : (
                // Full screen for one-to-one
                <Box style={styles.oneToOneContainer}>
                    {remoteUids.length > 0 ? (
                        renderParticipant(remoteUids[0])
                    ) : (
                        <Text style={styles.waitingText}>Waiting for participant...</Text>
                    )}

                    {/* <Box style={styles.localVideoContainerOneToOne}>
                        <RtcSurfaceView
                            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
                            style={styles.localVideoSmall}
                        />
                        <Text style={styles.userName}>You</Text>
                    </Box> */}
                </Box>
            )}
        </Box>

        {/* Control Buttons */}
        <Box style={styles.controls}>
            {/* <TouchableOpacity onPress={leaveChannel} style={styles.endCallButton}>
                <Text style={styles.buttonText}>End Call</Text>
            </TouchableOpacity> */}
            <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={leaveChannel}/>
        </Box>
    </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    oneToOneContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    localVideoContainerOneToOne: {
        position: 'absolute',
        bottom: 20,
        right:0,
        width: 120,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
    },
    localVideoSmall: {
        width: '100%',
        height: '100%',
    },
    localVideoContainer: {
        width: '50%',
        aspectRatio: 9 / 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    localVideo: {
        width: '100%',
        height: '100%',
    },
    remoteVideo: {
        flex: 1,
        aspectRatio: 9 / 16,
        margin: 4,
        borderRadius: 12,
    },
    participantContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    endCallButton: {
        backgroundColor: 'red',
        padding: 16,
        borderRadius: 30,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    userName: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        color: 'white',
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    waitingText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
    },
    remoteVideoBox: {
        width: '50%',
        aspectRatio: 1,
        margin: 2,
        top:50
    },
    fullScreenVideo: {
        width: '90%',
        aspectRatio: 1,
        margin: 2,
        bottom:50,
    },
});

const getPermission = async () => {
    if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        const granted =
            permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
            permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;

        if (!granted) {
            Alert.alert('Permissions Error', 'Camera and Microphone permissions are required.');
        }
        return granted;
    }
    return true; // iOS handles permissions differently
};


export default VideoCallScreen;