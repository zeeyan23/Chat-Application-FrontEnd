


import React, { useRef, useState, useEffect, useContext, useMemo } from 'react';
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
import axios from 'axios';

const appId = '4c1e2db4af064ae29874d36ac9f21d44';
const channelName = 'video_call';
const localUid = 0;

const VideoCallScreen = ({ route, navigation }) => {
    const { callerId, calleeId, isCaller,isGroup, participants = [] , memberId} = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUids, setRemoteUids] = useState([]);
    const remoteUidsRef = useRef([]);
    const [message, setMessage] = useState('');
    const eventHandler = useRef(null);
    const baseUrl = `${mainURL}/files/`;
    const socket = socketInstance.getSocket();
    const {userId, setUserId} = useContext(UserType);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [firstJoinedUid, setFirstJoinedUid] = useState(null); 
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

        const handleGroupCallEnded = async(data) => {
            //console.log("Received group_call_ended event:", data);
            Alert.alert("Call Ended", data.message);
            try {
                if (agoraEngineRef.current) {
                    await agoraEngineRef.current.leaveChannel();  // Leave Agora channel
                    await agoraEngineRef.current.disableAudio();  // Disable audio
                    await agoraEngineRef.current.disableVideo();  // Disable video
                    agoraEngineRef.current.removeAllListeners();  // Remove all Agora event listeners
                }
        
                setRemoteUids([]);  // 🔥 Force clear remaining users
                setIsJoined(false);  // Reset call state
        
                socket.off("group_video_call_ended", handleGroupCallEnded);  // Remove event listener
                navigation.goBack();  // Navigate back to previous screen
            } catch (error) {
                console.log("Error handling group call ended:", error);
            }
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
            //console.log(`🔄 Rejoined room after call: ${userId}`);
          }
        };
    }, []);

    const setupEventHandler = () => {
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                setMessage(`Successfully joined channel: ${channelName}`);
                setupLocalVideo();
                setIsJoined(true);
                agoraEngineRef.current?.enableVideo();
                agoraEngineRef.current?.enableAudio();
                agoraEngineRef.current?.muteLocalVideoStream(false);
                agoraEngineRef.current?.muteLocalAudioStream(false);

                setTimeout(() => {
                    agoraEngineRef.current?.enableVideo();
                    agoraEngineRef.current?.muteLocalVideoStream(false);
                    agoraEngineRef.current?.startPreview();
                }, 500);
            },
            onUserJoined: (_connection, uid) => {
                setMessage(`Remote user ${uid} joined`);
                
                // Add UID to state to track remote users
                //setRemoteUids((prevUids) => [...new Set([...prevUids, uid])]);
                setRemoteUids((prevUids) => {
                    const updatedUids = new Set(prevUids); // Preserve previous UIDs
                    updatedUids.add(uid); // Add new UID
                    console.log("✅ Updated remoteUids:", Array.from(updatedUids));
                    return Array.from(updatedUids); // Convert Set back to array
                });
                
                // setFirstJoinedUid((prevUid) => {
                //     if (prevUid === null || prevUid === undefined) {
                //         console.log("✅ Setting firstJoinedUid:", uid);
                //         return uid;
                //     }
                //     return prevUid; // Don't overwrite if already set
                // });
                setTimeout(() => {
                    remoteUids.forEach((uid) => {
                        agoraEngineRef.current?.muteRemoteVideoStream(uid, false);
                        agoraEngineRef.current?.muteRemoteAudioStream(uid, false);
                        agoraEngineRef.current?.setupRemoteVideo({ uid, renderMode: 1 });
                        //console.log(`✅ Subscribed to video/audio of UID: ${uid}`);
                    });
                }, 1000);
                
            },
            
            onUserPublished: (_connection, uid, mediaType) => {
                //console.log(`🎥 User ${uid} published ${mediaType}`);
    
                if (mediaType === "video") {
                    agoraEngineRef.current?.subscribe(uid, mediaType)
                        .then(() => {
                            setRemoteUids((prevUids) => [...new Set([...prevUids, uid])]);
                            //console.log(`✅ Subscribed to video for UID: ${uid}`);
                        })
                        .catch(err => console.error(`❌ Video subscription failed for UID ${uid}:`, err));
                }
            },
            onUserOffline: (_connection, uid) => {
                console.log(`User ${uid} left the channel`);
    setRemoteUids((prevUids) => prevUids.filter((id) => id !== uid));
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
                agoraEngineRef.current.enableDualStreamMode(true);
                agoraEngineRef.current.enableLocalVideo(true); 
                //console.log('✅ Agora Engine Initialized');
            }

        } catch (e) {
            console.error(e);
        }
    };

    const setupLocalVideo = async() => {
        try {
            if (agoraEngineRef.current) {
                //console.log('📷 Enabling local video');
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
        //const token = await getAgoraToken("video_call", localUid);
        agoraEngineRef.current?.enableVideo();
        agoraEngineRef.current?.startPreview();
        try {
            const response = await fetch(
                            `${mainURL}/generate_video_token?channelName=${channelName}&uid=${localUid}`
                          );
            const data = await response.json();
            const token = data.token;
             await agoraEngineRef.current?.joinChannel(token, channelName, localUid || 0, {
                channelProfile: isGroup ? ChannelProfileType.ChannelProfileLiveBroadcasting : ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: true,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
            setTimeout(() => {
                remoteUids.forEach((uid) => {
                    agoraEngineRef.current?.muteRemoteVideoStream(uid, false);
                    agoraEngineRef.current?.muteRemoteAudioStream(uid, false);
                    //console.log(`Subscribed to video of user: ${uid}`);
                });
            }, 1000);
        } catch (e) {
            console.log(e);
        }
    };


    
    const leaveChannel = async() => {
        
        
        try {
            if (agoraEngineRef.current) {
                await agoraEngineRef.current.leaveChannel();  // Leave the channel only for this user
                await agoraEngineRef.current.disableVideo();  // Disable local video
                await agoraEngineRef.current.disableAudio();  // Disable local audio
                agoraEngineRef.current.removeAllListeners();
            }
    
            // Remove the user from the participants list locally
            setRemoteUids((prevUids) => prevUids.filter((id) => id !== userId));
            setIsJoined(false);
            if(isGroup){
                if(isCaller){
                    await agoraEngineRef.current.leaveChannel(); 
                    socket.emit("leave_group_video_call", {participants:participants, userId: userId, isCaller: isCaller});
                }else{
                    await agoraEngineRef.current.leaveChannel(); 
                    socket.emit("leave_group_video_call", {participants:participants, memberId: memberId, isCaller: isCaller});
                }
            }else{
                setMessage('Left the channel');
                socket.emit("leave_video_call", { calleeId: calleeId, callerId: callerId });
                navigation.goBack();
            }
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

    //console.log("remoteUids",remoteUids)

    // const displayedUids = useMemo(() => {
    //     return firstJoinedUid && !remoteUids.includes(firstJoinedUid)
    //         ? [...new Set([firstJoinedUid, ...remoteUids])]
    //         : remoteUids;
    // }, [firstJoinedUid, remoteUids]);
    

    console.log("remoteUids", remoteUids)
    return (
        <SafeAreaView style={styles.container}>
        <Box style={styles.videoContainer}>
            {isGroup ? (
                // Grid layout for group participants
                <>
                    <Box>
                            <FlatList
                                data={remoteUids}
                                keyExtractor={(item) => item.toString()}
    renderItem={({ item }) => (
        <RtcSurfaceView canvas={{ uid: item }} style={styles.remoteVideoBox} />
    )}
                                numColumns={2}
                            />
                            <RtcSurfaceView
                                canvas={{ uid: userId, sourceType: VideoSourceType.VideoSourceCamera }}
                                style={styles.fullScreenVideo}
                            />
                            <RtcSurfaceView
                                canvas={{ uid: calleeId, sourceType: VideoSourceType.VideoSourceCamera }}
                                style={styles.fullScreenVideo}
                            />
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