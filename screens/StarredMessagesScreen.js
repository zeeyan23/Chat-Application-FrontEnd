import { Avatar, Box, Center, FlatList, Flex, HStack, Pressable, Spacer, Text, VStack } from "native-base";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import Entypo from '@expo/vector-icons/Entypo';
import { Image, Modal, StyleSheet, View } from "react-native";
import { Audio, ResizeMode, Video } from 'expo-av';
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

function StarredMessagesScreen({navigation}){

    const {userId, setUserId} = useContext(UserType);
    const [sound, setSound] = useState();
    const [audioStates, setAudioStates] = useState({});
    
    const [starredMessages, setStarredMessages]=useState([]);

    const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle:"Starred Messages"
        })
    },[]);

    useEffect(()=> {
        const fetchStarredMessages = async () => {
            
            const response = await axios.get(`${mainURL}/message/get-starred-messages/${userId}`);
            // setStarredMessages(response.data);
            const messages = response.data.filter(
                (message) => !message.clearedBy.includes(userId)
              );
              setStarredMessages(messages);
        }
        fetchStarredMessages();
    },[]);

    // console.log(JSON.stringify(starredMessages, null, 2));

    function formatTime(time){
        const options= {hour: "numeric", minute:"numeric"}
        return new Date(time).toLocaleString("en-US",options)
    } 

      const formatDuration = (durationInSeconds) => {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        return minutes > 0 
            ? `${minutes} min ${seconds} sec`
            : `${seconds} sec`;
      };

    const updateAudioState = (id, updates) => {
        setAudioStates((prevState) => ({
          ...prevState,
          [id]: {
            ...(prevState[id] || { isPlaying: false, currentPosition: 0, duration: 0 }),
            ...updates,
          },
        }));
      };
    
      const playSound = async (source, item) => {
        const itemId = item._id;
    
        console.log(itemId)
        try {
          // Stop currently playing audio
          if (currentlyPlayingId && currentlyPlayingId !== itemId) {
            await sound?.unloadAsync();
            updateAudioState(currentlyPlayingId, { isPlaying: false });
          }
      
          // Play selected audio
          if (currentlyPlayingId !== itemId) {
            const { sound: newSound, status } = await Audio.Sound.createAsync(source);
            setSound(newSound);
            setCurrentlyPlayingId(itemId);
            console.log("Audio Duration (ms):", status.durationMillis);
    
            updateAudioState(itemId, {
              isPlaying: true,
              duration: status.durationMillis,
            });
      
            newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded) {
                updateAudioState(itemId, {
                  currentPosition: status.positionMillis,
                });
      
                if (status.didJustFinish) {
                  updateAudioState(itemId, { isPlaying: false, currentPosition: 0 });
                  setCurrentlyPlayingId(null);
                  newSound.unloadAsync();
                }
              }
            });
      
            await newSound.playAsync();
          }
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      };
      
      const pauseSound = async (item) => {
        const itemId = item._id;
      
        if (currentlyPlayingId === itemId && sound) {
          await sound.pauseAsync();
          updateAudioState(itemId, { isPlaying: false });
          setCurrentlyPlayingId(null);
        }
      };
    
      //console.log(JSON.stringify(starredMessages, null, 2))
    return(
        <Box flex={1} background={"black"}>
            <FlatList
                data={starredMessages}
                renderItem={({ item }) => {
                    let source;
                        if (item.messageType === "image" && item.imageUrl) {
                        const baseUrl = `${mainURL}/files/`;
                        const imageUrl = item.imageUrl;
                        const normalizedPath = imageUrl.replace(/\\/g, "/");
                        const filename = normalizedPath.split("/").pop();
                        source = { uri: baseUrl + filename };
                        }
                        else if (item.messageType === "video" && item.videoUrl) {
                            const baseUrl = `${mainURL}/files/`;
                            const videoUrl = item.videoUrl;
                            const normalizedPath = videoUrl.replace(/\\/g, "/");
                            const filename = normalizedPath.split("/").pop();
                            source = { uri: baseUrl + filename };
                        }
                        else if (item.messageType === "audio" && item.audioUrl) {
                            const baseUrl = `${mainURL}/files/`;
                            const audioUrl = item.audioUrl;
                            const normalizedPath = audioUrl.replace(/\\/g, "/");
                            const filename = normalizedPath.split("/").pop();
                            source = { uri: baseUrl + filename };
                        }
                    return(
                    <Pressable
                    onPress={() => {
                        navigation.navigate("MessageScreen", {
                            recipentId: item.recepientId._id === item.starredBy[0]._id ? item.senderId._id : item.recepientId._id,
                            userName: item.senderId._id === item.starredBy[0]._id ? item.recepientId.user_name : item.senderId.user_name,
                            highlightedMessageId: item._id
                        });
                    }}>
                
                <Box pl={["4", "4"]} pr={["4", "5"]} py="5">
                    <HStack justifyContent="space-between" alignItems="center" width="100%">
                    <VStack flexDirection="row" space={1}>
                        <Text _dark={{ color: "warmGray.50" }} color="white" bold>
                            {item.senderId._id === item.starredBy[0]._id
                            ? `${item.senderId.user_name} `
                            : `${item.senderId.user_name} `}
                        </Text>
                        <Entypo name="arrow-bold-right" style={{ top: 5 }} size={15} color="white" />
                        <Text _dark={{ color: "warmGray.50" }} color="white" bold>
                            {item.senderId._id === item.starredBy[0]._id
                            ? `${item.recepientId.user_name}`
                            : `${item.starredBy[0].user_name}`}
                        </Text>
                    </VStack>

                    <Text
                        fontSize="sm"
                        
                        color="black"
                        textAlign="right"
                    >
                        {formatTime(item.created_date)}
                    </Text>
                    </HStack>
                        {item.messageType==='image' && source ? (
                            <Image source={source} style={{width:200, height:200, borderRadius:7}} onError={(error) => console.log("Image Load Error:", error)}/>
                        ) : item.messageType === "video" && source ? (
                            <>
                            <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.videoName}</Text>
                            <Box flexDirection={"row"} justifyContent={"space-between"}>
                              <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
                              <Text style={styles.infoText}>{formatTime(item.timeStamp)}</Text>
                            </Box>
                            </>
                          ) : item.messageType === "pdf" || item.messageType === "docx" || item.messageType === "xlsx" || item.messageType === "zip" || item.messageType === "pptx" ? (
                            <>
                            <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.fileName}</Text>
                            <Box flexDirection={"row"} justifyContent={"space-between"}>
                              <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
                              <Text style={styles.infoText}>{formatTime(item.timeStamp)}</Text>
                            </Box>
                            </>
                          ) : item.messageType==='audio' && source ? (
                            <>
                            <View flexDirection="row" alignItems="center" width="60%"  style={{backgroundColor:'#29F200', padding:5, borderRadius:8}}>
                                {audioStates[item._id]?.isPlaying ? (
                                    <Ionicons
                                        name="pause"
                                        size={32}
                                        color="#696969"
                                        onPress={() => pauseSound(item)}
                                    />
                                    ) : (
                                    <Ionicons
                                        name="play"
                                        size={32}
                                        color="#696969"
                                        onPress={() => playSound(source, item)}
                                    />
                                )}
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={1}
                                        value={(audioStates[item._id]?.currentPosition || 0) / (audioStates[item._id]?.duration || 1)}
                                        onSlidingComplete={(value) => {
                                        const seekPosition = value * (audioStates[item._id]?.duration || 0);
                                        sound?.setPositionAsync(seekPosition);
                                        updateAudioState(item._id, { currentPosition: seekPosition });
                                        }}
                                    />
                                </View>
                                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                                    {/* Left-aligned content */}
                                    <Text 
                                    style={[
                                        styles.infoText,
                                        { color: item?.senderId?._id === userId ? "white" : "black" }
                                    ]}
                                    >
                                    {formatDuration(item.duration)}
                                    </Text>

                                    {/* Right-aligned content */}
                                    <Box flexDirection="row" alignItems="center">
                                    <Text 
                                        style={[
                                        styles.infoText,
                                        { color: item?.senderId?._id === userId ? "white" : "black" }
                                        ]}
                                    >
                                        {formatTime(item.created_date)}
                                    </Text>
                                    {item?.starredBy[0] === userId && (
                                        <Entypo 
                                        name="star" 
                                        size={14}  
                                        color="#828282"  
                                        style={{ left: 5, top: 2 }}
                                        />
                                    )}
                                    </Box>
                                </Box>
                            </>
                          )
                           : <Box background="#29F200" paddingTop={1} paddingBottom={1} paddingRight={2} paddingLeft={2}  borderRadius={8}   alignSelf="flex-start" marginTop={2}>
                          <Text color="coolGray.600" _dark={{ color: "warmGray.200" }} >
                            {item.message || item.fileName}
                          </Text>
                        </Box>}
                </Box>
                </Pressable>
                )}}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={
                    <Box alignItems="center" justifyContent="center" mt="10">
                        <Text fontSize="lg" color="gray.500">
                            Starred mssages appear here
                        </Text>
                    </Box>
                }
            />
            
        </Box>

    )
}

const styles= StyleSheet.create({
    infoText: {
        fontSize: 10,
        textAlign:'right',
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 10, // Add spacing between duration and timestamp
      },
      slider: {
        width: '90%',
        height: 40,
        
      },
})
export default StarredMessagesScreen;