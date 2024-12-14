import {
    StyleSheet,
    View,
    ScrollView,
    KeyboardAvoidingView,
    TextInput,
    Pressable,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Modal,
  } from "react-native";
  import React, { useState, useContext, useLayoutEffect, useEffect,useRef } from "react";
  import { Feather } from "@expo/vector-icons";
  import { Ionicons } from "@expo/vector-icons";
  import { FontAwesome } from "@expo/vector-icons";
  import { MaterialIcons } from "@expo/vector-icons";
  import { Entypo } from "@expo/vector-icons";
  import EmojiSelector from "react-native-emoji-selector";
  import { useNavigation, useRoute } from "@react-navigation/native";
import { UserType } from "../Context/UserContext";
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { Box,Text } from "native-base";
import * as ImagePicker from "expo-image-picker"
import { ResizeMode, Video } from 'expo-av';
  const MessageSrceen = ({route}) => {
    const [showEmojiSelector, setShowEmojiSelector] = useState(false);
    const navigation = useNavigation();
    const [selectedImage, setSelectedImage] = useState("")
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const {userId, setUserId} = useContext(UserType);
    // const { recipentId, userName } = route.params;
    const { senderId, recipentId, userName } = route.params || {};

    const [getMessage, setGetMessage]=useState([])
    // const [recipentData, setRecipentData]= useState([]);
  
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoRef, setVideoRef] = useState(null);

    const handleVideoPress = (videoUrl) => {
      setSelectedVideo(videoUrl); // Open the clicked video
    };

    const handleCloseVideo = async () => {
      if (videoRef) {
        await videoRef.pauseAsync(); // Pause the video before closing
      }
      setSelectedVideo(null); // Close the video
    };

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle:"",
            headerLeft:()=>(
                <>
                    <Box flex={1} width={"sm"} flexDirection={"row"} alignItems={"center"} >
                        <Ionicons name="arrow-back-outline" size={24} color="black" onPress={()=> navigation.goBack()}/>
                        <Image width={30} height={30} borderRadius={15} resizeMode="cover" 
                            source={{uri:"https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"}} style={{marginHorizontal:10}}/>
                        <Text fontSize={"lg"} fontWeight={"bold"}>{userName}</Text>
                    </Box>
                </>
            )
        })
    },[]);

    const fetchMessages = async()=>{
      
      console.log("test",userId, recipentId, senderId);
        try {
          const url = senderId
            ? `${mainURL}/get-messages/${senderId}/${recipentId}`
            : `${mainURL}/get-messages/${userId}/${recipentId}`;
            const response = await axios.get(url).then((res)=>{
                 
                setGetMessage(res.data.message);
            })
        } catch (error) {
            console.log('Error:', error); 
            if (error.response) {
                console.log('Server Error:', error.response.data); 
            } else if (error.request) {
                console.log('Network Error:', error.request); 
            } else {
                console.log('Other Error:', error.message); 
            }
        }
    }

    useEffect(()=>{
        fetchMessages();
    },[])

    // useEffect(()=>{
    //     const fetchRecipentData = async()=>{
    //         try {
    //             const response = await axios.get(
    //                 `${mainURL}/user/${recipentId}`).then((res)=>{
    //                     const data = await response.json();
    //                     setRecipentData(data);
    //                 })
                     
    //         } catch (error) {
    //             console.log("Error", error);
                
    //         }
    //     }
    //     fetchRecipentData();
    // },[]);

    const handleEmojiPress = () => {
      setShowEmojiSelector(!showEmojiSelector);
    };

    function handleInputChange (enteredValue) {
        setMessage(enteredValue);
        setIsTyping(enteredValue.length > 0);
    };
    
    const sendMessage= async(messageType, fileUri, duration, fileName) =>{
        try {
            const formData = new FormData()
            formData.append("senderId",userId);
            formData.append("recepientId",recipentId);

            // if(messageType === "image"){
            //     formData.append("messageType","image")
            //     formData.append("imageFile",{
            //         uri: imageUri,
            //         name:"image.jpeg",
            //         type:"image/jpeg"
            //     })
            // }
            if (messageType === "image" || messageType === "video") {
              formData.append("messageType", messageType);
              formData.append("file", {
                  uri: fileUri,
                  name: messageType === "image" ? "image.jpeg" : "video.mp4",
                  type: messageType === "image" ? "image/jpeg" : "video/mp4", 
              });
            }
            if(messageType === 'video'){
              formData.append("duration",duration);
              formData.append("videoName",fileName);
            }
            else{
                formData.append("messageType","text");
                formData.append("message", message);
            }

            console.log(formData)
            const response = await axios.post(
                `${mainURL}/messages/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                }
            );
            setMessage("");
            setSelectedImage("");
            fetchMessages();
            
        } catch (error) {
            if (error.response) {
                console.log('Server Error:', error.response.data); 
            } else if (error.request) {
                console.log('Network Error:', error.request);
            } else {
                console.log('Other Error:', error.message);
            }
        }

    }


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

    const handleImage = async()=>{
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });

          console.log(result)
        if(!result.canceled){
            // sendMessage("image", result.assets[0].uri);
            const asset = result.assets[0];
            const isVideo = asset.type === 'video';

            sendMessage(isVideo ? "video" : "image", asset.uri, asset.duration, asset.fileName);
        }
    }
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
        <ScrollView>
          {getMessage.map((item, index)=>{
            if(item.messageType === 'text'){
                return(
                    <Pressable key={index} style={[
                        item?.senderId?._id ===userId ? {
                            alignSelf:'flex-end',
                            backgroundColor:'#29F200',
                            padding:8,
                            maxWidth:'60%',
                            margin:10,
                            borderRadius:7
                        } : {
                            alignSelf:'flex-start',
                            backgroundColor:'white',
                            padding:8,
                            margin:10,
                            maxWidth:'60%',
                            borderRadius:7
                        }
                    ]}>
                        <Text fontSize={13} textAlign={"left"} fontWeight={"medium"}>{item?.message}</Text>
                        <Text style={styles.infoText}>{formatTime(item.timeStamp)}</Text>
                    </Pressable>
                )
            }

            if(item.messageType === "image"){
              const baseUrl = `${mainURL}/files/`;
              const imageUrl= item.imageUrl;
              const normalizedPath = imageUrl.replace(/\\/g, "/"); 
              
              const filename=normalizedPath.split("/").pop();
              const source = {uri: baseUrl + filename}
              return(
                <Pressable key={index} style={[
                  item?.senderId?._id ===userId ? {
                      alignSelf:'flex-end',
                      backgroundColor:'#29F200',
                      //padding:8,
                      maxWidth:'60%',
                      margin:10,
                      borderRadius:7
                  } : {
                      alignSelf:'flex-start',
                      backgroundColor:'white',
                      //padding:8,
                      margin:10,
                      maxWidth:'60%',
                      borderRadius:7
                  }
              ]}>
                  <View>
                    <Image source={source} style={{width:200, height:200, borderRadius:7}} onError={(error) => console.log("Image Load Error:", error)}/>
                    <Text style={[styles.infoText,{position:"absolute", right:10, marginTop:5, bottom:7}]}>{formatTime(item.timeStamp)}</Text>
                  </View>
              </Pressable>
              )
            }

            if (item.messageType === 'video') {
              const baseUrl = `${mainURL}/files/`;
              const videoUrl= item.videoUrl;
              const normalizedPath = videoUrl.replace(/\\/g, "/"); 
              const filename=normalizedPath.split("/").pop();
              const source = {uri: baseUrl + filename}
              return (
                
                <Pressable key={index} style={[
                    item?.senderId?._id ===userId ? {
                        alignSelf:'flex-end',
                        backgroundColor:'#29F200',
                        padding:8,
                        maxWidth:'60%',
                        margin:10,
                        borderRadius:7
                    } : {
                        alignSelf:'flex-start',
                        backgroundColor:'white',
                        padding:8,
                        margin:10,
                        maxWidth:'60%',
                        borderRadius:7
                    }
                ]} onPress={() => handleVideoPress(source)}>
                      <Box flexDirection={"column"}>
                        <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.videoName}</Text>
                        <Box flexDirection={"row"} justifyContent={"space-between"}>
                          <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
                          <Text style={styles.infoText}>{formatTime(item.timeStamp)}</Text>
                        </Box>
                      </Box>

                </Pressable>
              );}
          })}
          {selectedVideo && (
            <Modal
              visible={!!selectedVideo}
              transparent={true}
              animationType="slide"
              onRequestClose={handleCloseVideo}
            >
              <View style={styles.modalContainer}>
                <Video
                  ref={(ref) => setVideoRef(ref)} 
                  source={selectedVideo}
                  style={styles.video}
                  resizeMode="contain"
                  useNativeControls 
                  shouldPlay 
                />
                {/* <Pressable onPress={handleCloseVideo} style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable> */}
                <Entypo name="cross" size={24} color="#666" onPress={handleCloseVideo} style={styles.closeButton}/>
              </View>
            </Modal>
          )}
        </ScrollView>
  
        <View
          style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#dddddd",
            marginBottom: showEmojiSelector ? 0 : 25,}}>
          {/* <Entypo
            onPress={handleEmojiPress}
            style={{ marginRight: 5 }}
            name="emoji-happy"
            size={24}
            color="gray"
          /> */}
  
          <TextInput
            value={message}
            onChangeText={handleInputChange}
            style={{ flex: 1, height: 40, borderWidth: 1, borderColor: "#dddddd", borderRadius: 20, paddingHorizontal: 10,}}
            placeholder="Type Your message..."/>
  
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 7,marginHorizontal: 8, }} >
             {!isTyping && (
                <TouchableOpacity>
                    <Entypo name="camera" size={24} color="#666" onPress={handleImage} />
                </TouchableOpacity>
             )}
            <TouchableOpacity>
                <Entypo name="attachment" size={24} color="#666" />
            </TouchableOpacity>
          </View>
  
          <TouchableOpacity>
            {isTyping ? (
                <Ionicons name="send-outline" size={24} color="black" onPress={()=>sendMessage("text")} />
            ) : (
                <Entypo name="mic" size={24} color="#666" />
            )}
            </TouchableOpacity>
        </View>
  
        {showEmojiSelector && (
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setMessage((prevMessage) => prevMessage + emoji);
            }}
            style={{ height: 250 }}
          />
        )}
      </KeyboardAvoidingView>
    );
  };
  
  export default MessageSrceen;
  
  const styles = StyleSheet.create({

    boxContainer: {
      flexDirection: 'column', 
    },
    fileName: {
      flex: 1, // Take remaining space
      fontSize: 14,
      fontWeight: 'bold',
      color: 'white',
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoText: {
      fontSize: 10,
      textAlign:'right',
      fontWeight: 'bold',
      color: 'white',
      marginLeft: 10, // Add spacing between duration and timestamp
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    video: {
      width: "90%",
      height: 300,
    },
    closeButton: {
      marginTop: 20,
      borderWidth:2,
      color:"#fff",
      borderColor:"#fff",
      padding: 10,
      borderRadius:100
    },
    closeText: {
      color: "#fff",
      fontSize: 16,
    },
  });