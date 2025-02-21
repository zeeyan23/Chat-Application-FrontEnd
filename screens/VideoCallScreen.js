


import React, { useRef, useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Switch,
    TouchableOpacity,
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

const appId = '77de8ca3881e4be1a07052447ee4cb51';
const token = '007eJxTYLiTOPfZKc++6bvenl+07sauzg5fH4ULK903/H578OSXu0aTFBjMzVNSLZITjS0sDFNNklINEw3MDUyNTEzMU1NNkpNMDY3+bk9vCGRk2NN9i5mRAQJBfC6GssyU1Pz45MScHAYGAO1tJ8Y=';
const channelName = 'video_call';
const localUid = 0;

const VideoCallScreen = ({ route, navigation }) => {
    const { isHost } = route.params;
    const agoraEngineRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');
    const eventHandler = useRef(null);

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
                clientRoleType: isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleBroadcaster, // Ensure both are broadcasters
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