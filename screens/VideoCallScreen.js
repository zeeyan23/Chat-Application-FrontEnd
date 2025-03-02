


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
    const { callerId, calleeId, isCaller,isGroup, participants = [] } = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUids, setRemoteUids] = useState([]);
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
                setRemoteUids(prevUids => [...new Set([...prevUids, uid])]);
                agoraEngineRef.current?.muteRemoteVideoStream(uid, false);
            },
            onUserOffline: (_connection, uid) => {
                setMessage(`Remote user ${uid} left the channel`);
                setRemoteUids(prevUids => prevUids.filter(id => id !== uid));
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
                channelProfile: isGroup ? ChannelProfileType.ChannelProfileLiveBroadcasting : ChannelProfileType.ChannelProfileCommunication,
                //clientRoleType: isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
                //clientRoleType: isCaller ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleBroadcaster, // Ensure both are broadcasters
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
            agoraEngineRef.current?.leaveChannel();
            setRemoteUids([]);
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

    return (
        <SafeAreaView style={styles.container}>
            {isJoined && (
                <View style={styles.videoContainer}>
                    {isGroup ? (
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
                    ) : (
                        remoteUids.map(uid => (
                            <RtcSurfaceView
                                key={uid}
                                canvas={{ uid, sourceType: VideoSourceType.VideoSourceRemote }}
                                style={styles.fullScreenVideo}
                            />
                        ))
                    )}
                    <View style={styles.localVideoContainer}>
                        <RtcSurfaceView
                            canvas={{ uid: localUid, sourceType: VideoSourceType.VideoSourceCamera }}
                            style={styles.localVideo}
                        />
                    </View>
                </View>
            )}

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
    },
    videoContainer: {
        flex: 1,
    },
    remoteVideoBox: {
        width: '48%',
        aspectRatio: 1,
        margin: 2,
    },
    fullScreenVideo: {
        flex: 1,
    },
    localVideoContainer: {
        position: 'absolute',
        bottom: 20,
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
        alignSelf: 'center',
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    leaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
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