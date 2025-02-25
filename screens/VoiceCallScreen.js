import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
  } from 'react-native-agora';
const appId = 'b1b769d4b203413881261d9f64b00d47';
const token = '007eJxTYFh6c4Hf7O/lmj3XHpo8Ppe6cN7zf1ISEYIeShv3HWCvffpcgSHJMMnczDLFJMnIwNjE0NjCwtDIzDDFMs3MJMnAIMXE/FnW3vSGQEYGs7+zWBkZIBDE52Ioy89MTo1PTszJYWAAANhqJBc=';
const channelName = 'voice_call';
const uid = 0;

function VoiceCallScreen({ route, navigation }){
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


    return(
        <>
            <SafeAreaView style={styles.container}>
                  
            
                {/* Floating Leave Button */}
                <TouchableOpacity onPress={leaveChannel} style={styles.leaveButton}>
                    <Text style={styles.leaveButtonText}>Leave Call</Text>
                </TouchableOpacity>
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