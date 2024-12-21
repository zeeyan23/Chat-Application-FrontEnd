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
  Platform,
  Alert,
  BackHandler,
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
import { Box,Button,Menu,Text } from "native-base";
import * as ImagePicker from "expo-image-picker"
import { ResizeMode, Video } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import socket from "../Utils/socketService";
import { io } from "socket.io-client";

const MessageSrceen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState("")
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showUnStar, setShowUnStar]=useState(false);
  const {userId, setUserId} = useContext(UserType);
  const [replyMessage, setReplyMessage]=useState(null);
  const [starredMessages, setStarredMessages] = useState([]);
  const route = useRoute();
  const { senderId, recipentId, userName } = route.params || {};

  const [getMessage, setGetMessage]=useState([])
  // const [recipentData, setRecipentData]= useState([]);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [seletedMessages,setSelectedMessages]=useState([]);


  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const flatListRef = useRef(null);
  const scrollViewRef = useRef(null);
  const socket = useRef();

  const fetchMessages = async()=>{
    try {
      const url = senderId
        ? `${mainURL}/get-messages/${senderId}/${recipentId}`
        : `${mainURL}/get-messages/${userId}/${recipentId}`;
        const response = await axios.get(url).then((res) => {
          
        
          // Filter messages to exclude those cleared by the current user
          const messages = res.data.message.filter(
            (message) => !message.clearedBy.includes(userId)
          );
          setGetMessage(messages);
        });
        

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

  useEffect(() => {
    socket.current = io(mainURL);

    socket.current.on("connect", () => {
      console.log("Socket connected:", socket.current.id);
      socket.current.emit("joinRoom", userId);
    });

    socket.current.on("newMessage", (message) => {
      setGetMessage((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [userId]);
  

  useEffect(()=>{
      fetchMessages();
  },[])

  
  


  const handleVideoPress = (videoUrl) => {
    setSelectedVideo(videoUrl); // Open the clicked video
  };

  const scrollToBottom = ()=>{
    if(scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated:true})
    }
  }
  
  useEffect(()=>{
    scrollToBottom();
  },[getMessage])

  

  const handleContentSizeChange=()=>{
    scrollToBottom();
  }

  const handleCloseVideo = async () => {
    if (videoRef) {
      await videoRef.pauseAsync(); // Pause the video before closing
    }
    setSelectedVideo(null); // Close the video
  };

  useEffect(() => {
    navigation.setParams({ headerNeedsUpdate: true });
  }, [seletedMessages]);
  


  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <Box flexDirection="row" alignItems="center" style={{ paddingLeft: 10 }}>
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color="black"
            onPress={() => navigation.goBack()}
          />
          {seletedMessages.length > 0 ? (
            <Text style={{ fontWeight: '500', fontSize: 16, marginLeft: 10 }}>
              {seletedMessages.length}
            </Text>
          ) : (
            <Box flexDirection="row" alignItems="center" marginLeft={1}>
              <Image
                width={30}
                height={30}
                borderRadius={15}
                resizeMode="cover"
                source={{
                  uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
                }}
                style={{ marginHorizontal: 10, width: 30, height: 30, borderRadius: 15 }}
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{userName}</Text>
            </Box>
          )}
        </Box>
      ),
      headerRight: () =>
        seletedMessages.length > 0 ? (
          <Box flexDirection="row" alignItems="center" style={{ marginRight: 10, gap: 20 }}>
            <Ionicons name="arrow-undo" size={24} color="black" onPress={()=> handleReplyMessage(seletedMessages)}/>
            {!showUnStar ? <Entypo name="star" size={24} color="black" onPress={()=> handleStarMessage(seletedMessages)}/> :
            <MaterialCommunityIcons name="star-off" size={24} color="black" onPress={() => unstarMessage(seletedMessages)}/>}
            <Pressable onPress={() => deleteMessage(seletedMessages)}>
              <Entypo name="trash" size={24} color="black" />
            </Pressable>
            <Ionicons name="arrow-redo-sharp" size={24} color="black" onPress={() => navigation.navigate('MessageForwardScreen', { 
              seletedMessages: seletedMessages,} )} />
          </Box>
        ) : (
          <Box w="90%" alignItems="flex-end" paddingRight={4}>
            <Menu w="190" trigger={triggerProps => {
                return <Pressable accessibilityLabel="More options menu" {...triggerProps} >
                        <Entypo name="dots-three-vertical" size={20} color="black" />
                      </Pressable>}}>
              <Menu.Item onPress={handleClearChat}>Clear Chat</Menu.Item>
            </Menu>
          </Box>
        ),
    });
  }, [navigation, seletedMessages, Platform.OS, userName]);

  const handleClearChat = async ()=>{
    const formData ={
      userId: userId,
      otherUserId: senderId ? senderId : recipentId
    }
    try {
      const response = await axios.post(`${mainURL}/clear-chat/`, formData);

      
      // Filter out messages cleared by the logged-in user
      const messages = response.data.filter(
        (message) => !message.clearedBy.includes(userId)
      );
  
      setGetMessage(messages);
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
  const handleReplyMessage = async (messageIds) => {
    if (messageIds.length === 1) {
      const selectedMessage = getMessage.find(
        (item) => item._id === messageIds[0]
      );
      setReplyMessage(selectedMessage);
      setSelectedMessages([]); 
    }
    else {
      setReplyMessage(null); 
    }
  };

  const handleStarMessage = async (messageIds) => {
  
    if (messageIds.length > 0) {
      try {
        await axios.patch(
          `${mainURL}/star-messages`, 
          {
            messageIds, // Pass the array of message IDs
            starredBy: userId, // ID of the user who starred the messages
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        setSelectedMessages([])
        fetchMessages();
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      setStarredMessages([]); // Clear reply if no message is selected
    }
  };
  

  const deleteMessage = async(messageIds)=>{
    const formData = messageIds;
    try {
      const response = await axios.post(`${mainURL}/deleteMessages/`, {messages: formData}).then((res)=>{
        setSelectedMessages((prevMessage)=> prevMessage.filter((id) => !messageIds.includes(id)))
        fetchMessages();
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
  
  const sendMessage= async(messageType, fileUri, duration, fileName, replyMessageId = replyMessage?._id) =>{

  
    // if(message.trim()){

    
      try {
          const formData = new FormData()
          formData.append("senderId",userId);
          formData.append("recepientId",recipentId);
          if (replyMessageId) {
            formData.append("replyMessage", replyMessageId); // Add replyMessage ID if available
          }
          
          if (messageType === "image" || messageType === "video") {
            formData.append("messageType", messageType);
            formData.append("file", {
                uri: fileUri,
                name: messageType === "image" ? "image.jpeg" : "video.mp4",
                type: messageType === "image" ? "image/jpeg" : "video/mp4", 
            });
              if (messageType === "video") {
                  formData.append("duration", duration);
                  formData.append("videoName", fileName);
              }
          } else {
              // Default to text if no file type is provided
              formData.append("messageType", "text");
              formData.append("message", message);
          }
          const response = await axios.post(
              `${mainURL}/messages/`,
              formData,
              {
                  headers: {
                      'Content-Type': 'multipart/form-data',
                    },
              }
          )
  
          setMessage("");
          setSelectedImage("");
          setReplyMessage(null);
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
    // }
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
      if(!result.canceled){
          // sendMessage("image", result.assets[0].uri);
          const asset = result.assets[0];
          const isVideo = asset.type === 'video';

          sendMessage(isVideo ? "video" : "image", asset.uri, asset.duration, asset.fileName);
      }
  }

  const checkMessageInDB = async (id, userId) => {
    // Replace with your actual API call
    console.log("userId",userId)
    try {
      const response = await axios.get(`${mainURL}/get-starred-message/${id}/${userId}`);
      return response.data.exists;
    } catch (error) {
      console.log('Error:', error); // Log error details
      if (error.response) {
          console.log('Server Error:', error.response.data); // Server-side error
      } else if (error.request) {
          console.log('Network Error:', error.request); // Network-related issue
      } else {
          console.log('Other Error:', error.message); // Any other error
      }
    }

  };

  const unstarMessage = async (seletedMessages) => {
    const idArray = seletedMessages;
    const id = idArray[0]; 
    try {
      const response = await axios.delete(`${mainURL}/delete-starred-message/${userId}/${id}/`);
      if(response.status==200){
        setShowUnStar(false);
        fetchMessages();
        setSelectedMessages([])
      }

    } catch (error) {
      console.log('Error:', error); // Log error details
      if (error.response) {
          console.log('Server Error:', error.response.data); // Server-side error
      } else if (error.request) {
          console.log('Network Error:', error.request); // Network-related issue
      } else {
          console.log('Other Error:', error.message); // Any other error
      }
    }
  };

  const handleSelectedMessage = async(message)=>{
    try {
      const response = await checkMessageInDB(message._id, message.starredBy[0]);
    
      if (response) {
        
        setShowUnStar(true)
        const isSelected = seletedMessages.includes(message._id);

        if(isSelected){
          setSelectedMessages((preMessage)=> preMessage.filter((id)=> id !== message._id))
        }else{
          setSelectedMessages((preMessage)=> [...preMessage, message._id])
        }
      } else {
        const isSelected = seletedMessages.includes(message._id);

        if(isSelected){
          setSelectedMessages((preMessage)=> preMessage.filter((id)=> id !== message._id))
        }else{
          setSelectedMessages((preMessage)=> [...preMessage, message._id])
        }
      }
    } catch (error) {
      console.log('Error:', error); // Log error details
            if (error.response) {
                console.log('Server Error:', error.response.data); // Server-side error
            } else if (error.request) {
                console.log('Network Error:', error.request); // Network-related issue
            } else {
                console.log('Other Error:', error.message); // Any other error
            }
    }
    
  }
  

  const clearReplyMessage = () => setReplyMessage(null);

  const ReplyMessageView = () => {
    return (
      <Box
        style={{
          backgroundColor: "#E0FFE8",
          padding: 8,
          marginBottom: 10,
          borderRadius: 5,
          borderLeftWidth: 4,
          borderLeftColor: "#29F200",
        }}
      >
        <Box flexDirection="row" justifyContent="space-between">
          <Text style={{ color: "#555", fontSize: 12 }}>{replyMessage?.senderId?._id === userId ? "You" : replyMessage?.senderId?.user_name}</Text>
          <Ionicons
            name="close"
            size={20}
            color="black"
            onPress={clearReplyMessage}
          />
        </Box>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: "#333",
            marginTop: 2,
          }}
        >
          {replyMessage?.message}
        </Text>
      </Box>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{flexGrow:1}} onContentSizeChange={scrollToBottom}>
        {getMessage.map((item, index)=>{
          if(item.messageType === 'text'){
            const isSelected = seletedMessages.includes(item._id)
            const isRepliedMessage = highlightedMessageId === item._id;
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
                      }, isSelected && {width: "100%", backgroundColor:"#D2FFCD"}
                  ]} onLongPress={()=> handleSelectedMessage(item)}>
                      {item?.replyMessage && (

                        <Pressable style={{ backgroundColor: "#E0FFE8", padding: 8, borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",}}>
                          
                          <Text style={{ fontSize: 12, fontWeight: "500", color: "#333", marginTop: 2, }}>
                            {item?.replyMessage?.message}
                          </Text>
                        </Pressable>
                    )}

                    {/* Display the original message */}
                    <Text
                        style={{
                            fontSize: 14,
                            textAlign: item?.senderId?._id === userId ? 'right' : 'left',
                            fontWeight: 'medium',
                        }}
                    >
                        {item?.message}
                        
                    </Text>
                    {/* Format and display the timestamp */}
                    <Text style={[styles.infoText, { color: 'black' }]}>
                        {formatTime(item.timeStamp)} 
                        {item?.starredBy[0] === userId && (
                          <Text
                            style={{
                              position: 'absolute',
                              right: 0, // Align the star to the corner
                              top: -4, // Adjust position as needed
                              fontSize: 14,
                              color: '#FFD700', // Golden color for the star
                            }}
                          >
                            <Entypo name="star" size={10} color="#828282"/>
                          </Text>
                        )}
                    </Text>
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

        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {replyMessage && <ReplyMessageView />}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
          <TextInput
                  value={replyMessage || message}
                  onChangeText={handleInputChange}
                  style={{
                    flex: 1,
                    height: 40,
                    borderWidth: 1,
                    borderColor: "#dddddd",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                  }}
                  placeholder={ "Type Your message..."}
                />
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
          
        </View>


        
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