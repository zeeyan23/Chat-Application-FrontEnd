// Import React Hooks
import React, { useRef, useState, useEffect } from 'react';
// Import user interface elements
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    PermissionsAndroid,
    Platform,
    Alert
} from 'react-native';
// Import Agora SDK
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
} from 'react-native-agora';
import { mainURL } from '../Utils/urls';
import { io } from "socket.io-client";
// Define basic information
const appId = 'b1b769d4b203413881261d9f64b00d47';
const token = '007eJxTYLAy3DFt1vZsPYvHviFFNiqpZyYUvTR0uOrdpVYosn5WvLICQ5JhkrmZZYpJkpGBsYmhsYWFoZGZYYplmplJkoFBiom5v+Xq9IZARoYJ9yKYGBkgEMTnYijLz0xOjU9OzMlhYAAAU4kfPg==';
const channelName = 'voice_call';
const uid = 0;

const CallScreen = ({route}) => {
    const agoraEngineRef = useRef(null); // IRtcEngine instance
    const [isJoined, setIsJoined] = useState(false); // Whether the local user has joined the channel
    const [isHost, setIsHost] = useState(true); // User role
    const [remoteUid, setRemoteUid] = useState(route?.params?.recipentId || null); // Uid of the remote user
    const [message, setMessage] = useState(''); // User prompt message
    const eventHandler = useRef(null); // Callback functions
    const socket = useRef();

    const {userId}=route.params;
    socket.current = io(mainURL);
    useEffect(() => {
        
        socket.current.emit("registerUser", userId); // Send userId when online
        //setupVideoSDKEngine();

        socket.current.on("incoming-call", ({ from, channelName }) => {
            Alert.alert(
                "Incoming Call",
                `User ${from} is calling`,
                [
                    { text: "Decline", onPress: () => declineCall(from) },
                    { text: "Accept", onPress: () => acceptCall(from, channelName) }
                ]
            );
        });
    
        socket.current.on("call-accepted", ({ channelName }) => {
            join(channelName); // Join Agora channel
        });
    
        socket.current.on("call-declined", () => {
            Alert.alert("Call Declined", "The user declined your call.");
        });

        socket.current.on("join-call", ({ channelName }) => {
            join(channelName);
        });
        
        return () => {
            if (agoraEngineRef.current && eventHandler.current) {
                agoraEngineRef.current.unregisterEventHandler(eventHandler.current);
            }
            if (agoraEngineRef.current) {
                agoraEngineRef.current.release();
            }
            
            socket.current.off("incoming-call");
            socket.current.off("call-accepted");
            socket.current.off("call-declined");
            socket.current.disconnect();
        };

    }, []);

    useEffect(() => {
        setupVideoSDKEngine();
    }, []);
    
    // Define the setupVideoSDKEngine method called when the App starts
    const setupVideoSDKEngine = async () => {
        try {
            // Create RtcEngine after obtaining device permissions
            if (Platform.OS === 'android') {
                await getPermission();
            }
            agoraEngineRef.current = createAgoraRtcEngine();
            const agoraEngine = agoraEngineRef.current;

            eventHandler.current = {
                onJoinChannelSuccess: () => {
                    showMessage('Successfully joined channel: ' + channelName);
                    setIsJoined(true);
                    agoraEngineRef.current?.enableAudio(); 
                },
                onUserJoined: (_connection, uid) => {
                    showMessage('Remote user ' + uid + ' joined');
                    setRemoteUid(uid);
                },
                onUserOffline: (_connection, uid) => {
                    showMessage('Remote user ' + uid + ' left the channel');
                    setRemoteUid(0);
                },
                onAudioVolumeIndication : (speakers, totalVolume) => {
                    console.log("Audio volume detected:", totalVolume);
                    if (speakers.length > 0) {
                        console.log("Speaking user:", speakers[0].uid, "Volume:", speakers[0].volume);
                    }
                }
            };

            // Register the event handler
            agoraEngine.registerEventHandler(eventHandler.current);
            // Initialize the engine
            agoraEngine.initialize({
                appId: appId,
            });
        } catch (e) {
            console.log(e);
        }
    };

    // Define the join method called after clicking the join channel button
    const join = async () => { 
        if (isJoined) return;
    
        console.log("Joining Agora channel:", channelName, "Token:", token);
    
        try {
            if (isHost) {
                agoraEngineRef.current?.joinChannel(token, channelName, userId, {
                    channelProfile: ChannelProfileType.ChannelProfileCommunication,
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                    publishMicrophoneTrack: true,
                    autoSubscribeAudio: true,
                });
            }
        } catch (e) {
            console.log("Join error:", e);
        }
    };
    

    // eventHandler.current.onAudioVolumeIndication = (speakers, totalVolume) => {
    //     console.log("Audio volume detected:", totalVolume);
    //     if (speakers.length > 0) {
    //         console.log("Speaking user:", speakers[0].uid, "Volume:", speakers[0].volume);
    //     }
    // };
    
    // Define the leave method called after clicking the leave channel button
    const leave = () => {
        try {
            // Call leaveChannel method to leave the channel
            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            showMessage('Left the channel');
        } catch (e) {
            console.log(e);
        }
    };

    // Display information
    function showMessage(msg) {
        setMessage(msg);
    }

    const startCall = () => {
        console.log(userId, remoteUid)
        socket.current.emit("call-user", {
            from: userId, 
            to: remoteUid, 
            channelName
        });
    };
    
    const acceptCall = (from, channel) => {
        socket.current.emit("accept-call", { from, to: userId, channelName: channel });
        join(); // ✅ No need to pass the channel name now
    };
    
    
    const declineCall = (from) => {
        socket.current.emit("decline-call", { from, to: userId });
    };

    
    // Render user interface
    return (
        <SafeAreaView style={styles.main}>
            <Text style={styles.head}>Agora Voice Calling Quickstart</Text>
            <View style={styles.btnContainer}>
            <Text onPress={startCall} style={styles.button}>Call User</Text>

                <Text onPress={leave} style={styles.button}>
                    Leave Channel
                </Text>
            </View>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContainer}>
                {isJoined ? (
                    <Text>Local user uid: {uid}</Text>
                ) : (
                    <Text>Join a channel</Text>
                )}
                {isJoined && remoteUid !== 0 ? (
                    <Text>Remote user uid: {remoteUid}</Text>
                ) : (
                    <Text>Waiting for remote user to join</Text>
                )}
                <Text>{message}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// Define user interface styles
const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 25,
        paddingVertical: 4,
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: '#0055cc',
        margin: 5,
    },
    main: { flex: 1, alignItems: 'center' },
    scroll: { flex: 1, backgroundColor: '#ddeeff', width: '100%' },
    scrollContainer: { alignItems: 'center' },
    btnContainer: { flexDirection: 'row', justifyContent: 'center' },
    head: { fontSize: 20 },
});

const getPermission = async () => {
    
        const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
    
        return granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
               granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;

}    

export default CallScreen;
