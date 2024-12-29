import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  Alert,
  BackHandler,
  Linking,
} from "react-native";
import React, { useState, useContext, useLayoutEffect, useEffect,useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserType } from "../Context/UserContext";
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { Box,Button,Heading,HStack,Icon,IconButton,Menu,Spinner,Text,Pressable } from "native-base";
import * as ImagePicker from "expo-image-picker"
import { ResizeMode, Video } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { io } from "socket.io-client";
import moment from 'moment';
import * as DocumentPicker from 'expo-document-picker';
const MessageSrceen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showUnStar, setShowUnStar]=useState(false);
  const [isReplyPressed, setIsReplyPressed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("")
  const [message, setMessage] = useState("");

  const [starredMessages, setStarredMessages] = useState([]);
  const [getMessage, setGetMessage]=useState([]);
  const [seletedMessages,setSelectedMessages]=useState([]);
  // const [recipentData, setRecipentData]= useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);
  const socket = useRef();
  const {userId, setUserId} = useContext(UserType);

  const [replyMessage, setReplyMessage]=useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [highLight, setHighLight]=useState(null);
  const [document, setDocument] = useState(null);
  
  const { senderId, recipentId, userName } = route.params || {};
  const { highlightedMessageId } = route.params || {};
  
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleReplyPress = (replyMessageId) => {
    setIsReplyPressed(true); 
    const messageIndex = getMessage.findIndex(
      (msg) => msg._id === replyMessageId
    );
  
    if (messageIndex !== -1) {
      scrollViewRef.current?.scrollTo({ y: messageIndex * 80, animated: true }); 
      setHighLight(replyMessageId);
      setTimeout(() => {
      }, 500);
    }
  };

  useEffect(() => {
    if (highlightedMessageId) {
        handleReplyPress(highlightedMessageId);
    }
  }, [highlightedMessageId]);

  useEffect(() => {
    if (!highlightedMessageId && !isReplyPressed) {
        scrollToBottom();
    }
  }, [getMessage, isReplyPressed]);


  const fetchMessages = async()=>{
    try {
      const url = senderId
        ? `${mainURL}/get-messages/${senderId}/${recipentId}`
        : `${mainURL}/get-messages/${userId}/${recipentId}`;
        const response = await axios.get(url).then((res) => {

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
    setSelectedVideo(videoUrl);
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseVideo = async () => {
    if (videoRef) {
      await videoRef.pauseAsync();
    }
    setSelectedVideo(null);
  };

  const handleCloseImage = async () => {
    setSelectedImage(null);
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
          <Box flexDirection="row" marginRight={3}>
            <IconButton icon={<Icon as={Ionicons} name="arrow-undo" />} color="black" onPress={()=> handleReplyMessage(seletedMessages)} />
            
            {!showUnStar ?  <IconButton icon={<Icon as={Entypo} name="star" />} color="black" onPress={()=> handleStarMessage(seletedMessages)} /> :
            <IconButton icon={<Icon as={MaterialCommunityIcons} name="star-off" />} color="black" onPress={() => unstarMessage(seletedMessages)} />}
            <IconButton icon={<Icon as={Entypo} name="trash" />} color="black" onPress={() => deleteMessage(seletedMessages)} />
            <IconButton icon={<Icon as={Ionicons} name="arrow-redo-sharp" />} color="black" onPress={() => navigation.navigate('MessageForwardScreen', { 
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
  console.log(messageIds)
    if (messageIds.length > 0) {
      try {
        await axios.patch(
          `${mainURL}/star-messages`, 
          {
            messageIds, 
            starredBy: userId, 
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
      setStarredMessages([]); 
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

    setIsSending(true); // Start loading
    setErrorMessage(""); // Clear any previous errors
      try {
          const formData = new FormData()
          formData.append("senderId",userId);
          formData.append("recepientId",recipentId);
          if (replyMessageId) {
            formData.append("replyMessage", replyMessageId);
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
          } else if ( messageType === "pdf" || messageType === "docx" || messageType === "xlsx" || messageType === "zip" || messageType === "pptx") {
            formData.append("messageType", messageType);
            formData.append("file", {
              uri: fileUri,
              name: `file.${messageType}`,
              type: `application/${messageType === "docx" ? "docx" : messageType}`,
            });
            formData.append("fileName", fileName);
          }
          else {
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

          
          socket.current.emit("send_message", {
            senderId: userId,
            receiverId: recipentId,
            message: message,
            timestamp: new Date().toISOString(),
          });
          
      
      } catch (error) {
          if (error.response) {
              console.log('Server Error:', error.response.data); 
              setErrorMessage("Server Error: " + error.response.data.message);
          } else if (error.request) {
              console.log('Network Error:', error.request);
              setErrorMessage("Network Error: Please check your internet connection.");
          } else {
              console.log('Other Error:', error.message);
              setErrorMessage("Error: " + error.message);
          }
      } finally{
        setIsSending(false);
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
          const asset = result.assets[0];
          const isVideo = asset.type === 'video';

          sendMessage(isVideo ? "video" : "image", asset.uri, asset.duration, asset.fileName);
      }
  }

  const checkMessageInDB = async (id, userId) => {
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
    console.log(message)
    try {

      if (!message.starredBy || message.starredBy.length === 0) {
        const isSelected = seletedMessages.includes(message._id);
        if (isSelected) {
          setSelectedMessages((preMessage) => preMessage.filter((id) => id !== message._id));
        } else {
          setSelectedMessages((preMessage) => [...preMessage, message._id]);
        }
        return; 
      }

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

  const handleDocument = async()=>{
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', 
      });
      console.log(result)
      if(!result.canceled){
        const asset = result.assets[0];
        const mimeType = asset.mimeType;
        const fileName = asset.name; 
        let docType = '';
        console.log(result)
        if (mimeType === 'application/pdf') {
          docType = 'pdf';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          docType = 'docx';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          docType = 'pptx';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          docType = 'xlsx';
        } else if (mimeType === 'application/zip') {
          docType = 'zip';
        }
        sendMessage(docType, asset.uri, null,fileName);
      }
    } catch (error) {
      console.log('Error picking document:', error);
    }
  }

  const clearReplyMessage = () => setReplyMessage(null);

  const ReplyMessageView = () => {
    let source=null; 
    if(replyMessage?.messageType==="image"){
      const baseUrl = `${mainURL}/files/`;
      const imageUrl= replyMessage.imageUrl;
      const normalizedPath = imageUrl.replace(/\\/g, "/"); 
      const filename=normalizedPath.split("/").pop();
      source = {uri: baseUrl + filename}
    }
    
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
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ marginTop: 2 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#333",
              flex: 1, // Ensure the text takes up available space
              marginRight: 10, // Add spacing between text and image
            }}
          >
            {replyMessage?.messageType === "text"
              ? replyMessage?.message
              : `${replyMessage?.messageType}`}
          </Text>
          
          {source && <Image
            source={source}
            style={{
              width: 50,
              height: 50,
              borderRadius: 7,
            }}
            onError={(error) => console.log("Image Load Error:", error)}
          />}
        </Box>

      </Box>
    );
  };

  const formatDate = (inputDate) => {
    const today = moment();
    const input = moment(inputDate);
  
    if (input.isSame(today, 'day')) {
      return 'Today';
    } else if (input.isSame(today, 'week')) {
      return input.format('dddd'); 
    } else {
      return input.format('DD-MM-YYYY');
    }
  };

  const getIconName = (messageType) => {
    switch (messageType) {
      case 'pdf':
        return 'file-pdf-box';
      case 'docx':
        return 'file-word-box';
      case 'pptx':
        return 'file-powerpoint';
      case 'xlsx':
        return 'file-excel-box';
      case 'zip':
        return 'zip-box';
      default:
        return 'file'; // Default icon if no match
    }
  };

  const openFile = (documentUrl) => {
    const baseUrl = `${mainURL}/files/`;
    const normalizedPath = documentUrl.replace(/\\/g, '/');
    const filename = normalizedPath.split('/').pop();
    const fileUrl = baseUrl + filename;
    Linking.openURL(fileUrl).catch((err) => console.error("Failed to open URL: ", err));
  };

  const truncateText = (text, wordLimit) => {
    if (!text) return ""; 
    const words = text.split(" ");
    return words.length > wordLimit 
      ? words.slice(0, wordLimit).join(" ") + "..." 
      : text;
  };

  console.log(JSON.stringify(getMessage, null,2))
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{flexGrow:1}} >
        {getMessage.map((item, index)=>{
          const currentDate = formatDate(item.timeStamp); // Use the utility function
          const previousDate =
            index > 0 ? formatDate(getMessage[index - 1].timeStamp) : null;
          const showDateSeparator = currentDate !== previousDate;
          
          if(item.messageType === 'text'){
            const isSelected = seletedMessages.includes(item._id)
            const isRepliedMessage = highlightedMessageId === item._id;
            const baseUrl = `${mainURL}/files/`;
            const imageUrl= item.replyMessage?.imageUrl;
            const normalizedPath = imageUrl?.replace(/\\/g, "/"); 
            const filename=normalizedPath?.split("/").pop();
            const source = {uri: baseUrl + filename}
              return(
                <View key={index}>
                  {showDateSeparator && (
                    <Text
                      style={{
                        alignSelf: 'center',
                        backgroundColor: '#333',
                        color: 'white',
                        padding: 5,
                        borderRadius: 10,
                        marginVertical: 10,
                      }}
                    >
                      {currentDate}
                    </Text>
                  )}
                  <Pressable style={[
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
                      }, isSelected && {width: "100%", backgroundColor:"#D2FFCD"},
                      highlightedMessageId === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
                      highLight === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
                  ]} onLongPress={()=> handleSelectedMessage(item)}>
                    {/* {item?.replyMessage && (
                      
                    )} */}
                    {item.replyMessage?.messageType==='text' ? 
                      <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                        style={{ backgroundColor: "#E0FFE8", padding: 8, borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",}}>
                        <Text 
                          style={{ fontSize: 12, fontWeight: "500", color: "#333", marginTop: 2, }} numberOfLines={1} ellipsizeMode="tail">
                          {truncateText(item?.replyMessage?.message, 5)}
                        </Text>
                      </Pressable> : 
                      item.replyMessage?.messageType==='image' ? 
                      <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                        style={{ backgroundColor: "#E0FFE8", borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800"}}>
                          <Box flexDirection="row" alignItems="center">
                            <Box>
                              <Image
                                source={source}
                                style={{
                                  width: 50,
                                  height: 50,
                                }}
                                onError={(error) => console.log("Image Load Error:", error)}
                              />
                            </Box>
                          </Box>
                          
                      </Pressable>: item.replyMessage?.messageType==='video' ? 
                      <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                        style={{ backgroundColor: "#E0FFE8", borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",padding:2}}>
                          <Box flexDirection="row" alignItems="center">
                            <Box>
                              <Text>{item.replyMessage.videoName}</Text>
                            </Box>
                          </Box>
                          
                      </Pressable>: item.replyMessage?.messageType==='pdf' || item.replyMessage?.messageType==='docx' ||
                      item.replyMessage?.messageType==='pptx' || item.replyMessage?.messageType==='zip' || item.replyMessage?.messageType==='xlsx' ?
                      <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                        style={{ backgroundColor: "#E0FFE8", borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",padding:2}}>
                          <Box flexDirection="row" alignItems="center">
                            <Box>
                              <MaterialCommunityIcons
                                name={getIconName(item.replyMessage?.messageType)}
                                size={35}
                                color="#007A33"
                                style={{ marginRight: 10 }}
                              />
                              <Text>{item.replyMessage.fileName}</Text>
                            </Box>
                          </Box>
                          
                      </Pressable>: null}
                    
                    <Text
                        style={{ fontSize: 14, textAlign: item?.senderId?._id === userId ? 'left' : 'left', fontWeight: 'medium'}}>
                        {item?.message}       
                    </Text>
                    <Text style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}>
                        {formatTime(item.timeStamp)} 
                        {item?.starredBy[0] === userId && (
                          <Text
                            style={{ position: 'absolute', right: 0, top: -4,  fontSize: 14, color: '#FFD700',}}>
                            <Entypo name="star" size={10} color="#828282"/>
                          </Text>
                        )}
                    </Text>
                  </Pressable>
                </View>
              )
          }

          if(item.messageType === "image"){
            const isSelected = seletedMessages.includes(item._id)
            const baseUrl = `${mainURL}/files/`;
            const imageUrl= item.imageUrl;
            const normalizedPath = imageUrl.replace(/\\/g, "/"); 
            const filename=normalizedPath.split("/").pop();
            const source = {uri: baseUrl + filename}

            return(
              <View key={index} >
              {showDateSeparator && (
                    <Text
                      style={{
                        alignSelf: 'center',
                        backgroundColor: '#333',
                        color: 'white',
                        padding: 5,
                        borderRadius: 10,
                        marginVertical: 10,
                      }}
                    >
                      {currentDate}
                    </Text>
                )}
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
                },highlightedMessageId === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
            ]} onLongPress={()=> handleSelectedMessage(item)}  onPress={() => handleImagePress(source)} >
                
                  <Image source={source} style={{width:200, height:200, borderRadius:7}} onError={(error) => console.log("Image Load Error:", error)}/>
                  <Box flexDirection={"row"}>
                  <Text style={[styles.infoText,{position:"absolute", right:10, marginTop:5, bottom:7}]}>{formatTime(item.timeStamp)}</Text>
                    {item?.starredBy[0] === userId && (
                      <Entypo
                        name="star"
                        size={14} 
                        color="white" 
                        style={{
                          left:10,
                          bottom:10,
                          position:"absolute"
                        }}
                      />
                    )}
                  </Box>
            </Pressable>
            </View>
            )
          }

          if (item.messageType === 'video') {
            const isSelected = seletedMessages.includes(item._id)
            const baseUrl = `${mainURL}/files/`;
            const videoUrl= item.videoUrl;
            const normalizedPath = videoUrl.replace(/\\/g, "/"); 
            const filename=normalizedPath.split("/").pop();
            const source = {uri: baseUrl + filename}
            return (
              <View key={index} >
              {showDateSeparator && (
                    <Text
                      style={{
                        alignSelf: 'center',
                        backgroundColor: '#333',
                        color: 'white',
                        padding: 5,
                        borderRadius: 10,
                        marginVertical: 10,
                      }}
                    >
                      {currentDate}
                    </Text>
                  )}
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
                  }, highlightedMessageId === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
              ]} onPress={() => handleVideoPress(source)}  onLongPress={()=> handleSelectedMessage(item)}>
                    
                      <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.videoName}</Text>
                      <Box flexDirection={"row"}>
                        <Text style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}>{formatDuration(item.duration)}</Text>
                        <Text style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}>{formatTime(item.timeStamp)}</Text>
                        {item?.starredBy[0] === userId && (
                          <Entypo
                            name="star"
                            size={14} 
                            color="#828282" 
                            style={{
                              left:5,
                              top:2
                            }}
                          />
                        )}
                      </Box>
              </Pressable>
              </View>
            );}

            if (item.messageType === "pdf" || item.messageType === "docx" || item.messageType === "xlsx" || item.messageType === "zip" || item.messageType === "pptx") {
              const isSelected = seletedMessages.includes(item._id)
              const baseUrl = `${mainURL}/files/`;
              const documentUrl= item.documentUrl;
              const normalizedPath = documentUrl.replace(/\\/g, "/"); 
              const filename=normalizedPath.split("/").pop();
              const source = {uri: baseUrl + filename}
              return (
                <View key={index} >
                {showDateSeparator && (
                      <Text
                        style={{
                          alignSelf: 'center',
                          backgroundColor: '#333',
                          color: 'white',
                          padding: 5,
                          borderRadius: 10,
                          marginVertical: 10,
                        }}
                      >
                        {currentDate}
                      </Text>
                    )}

                    <Pressable
                      
                      key={index}
                      style={[
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
                          }, highlightedMessageId === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
                      ]}
                      onLongPress={() => handleSelectedMessage(item)} onPress={() => openFile(item.documentUrl)}
                    >
                      <Box padding={2} borderRadius={7} flexDirection={"row"} flexWrap="wrap" alignItems="flex-start" background={"#D4D4D4"}>
                        <MaterialCommunityIcons
                            name={getIconName(item.messageType)}
                            size={35}
                            color="#007A33"
                            style={{ marginRight: 10 }}
                          />
                        <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"} numberOfLines={2}
                          style={{
                            flexShrink: 1,
                            flexWrap: 'wrap',
                            maxWidth: '100%', 
                          }} >{item.fileName}</Text>
                      </Box>
                      
                      <Box flexDirection={"row"}>
                        <Text style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}>{item.messageType.toUpperCase()}</Text>
                        <Text style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}>{formatTime(item.timeStamp)}</Text>
                            {item?.starredBy[0] === userId && (
                              <Entypo
                                name="star"
                                size={14} 
                                color="#828282" 
                                style={{
                                  left:5,
                                  top:2
                                }}/>)}
                      </Box>
                    </Pressable>
                </View>
              );}
        })}
        {isSending && (
            <HStack space={2} justifyContent="flex-end" paddingRight={5}>
              <Spinner accessibilityLabel="Loading posts" />
              <Heading color="primary.500" fontSize="md">
                Loading
              </Heading>
            </HStack>
        )}

        {/* Error Message */}
        {errorMessage && (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Text style={{ fontSize: 16, color: "red" }}>{errorMessage}</Text>
          </View>
        )}
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
              <Entypo name="cross" size={24} color="#666" onPress={handleCloseVideo} style={styles.closeButton}/>
            </View>
          </Modal>
        )}

        {selectedImage && (
          <Modal
            visible={!!selectedImage}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCloseImage}
          >
            <View style={styles.modalContainer}>
              
              <Image ref={(ref) => setImageRef(ref)}  source={selectedImage} style={styles.fullScreenImage} onError={(error) => console.log("Image Load Error:", error)}/>
            </View>
          </Modal>
        )}
      </ScrollView>

      <View
        style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#dddddd",
          marginBottom: showEmojiSelector ? 0 : 25,}}>
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
                paddingHorizontal: 10,}}
                placeholder={ "Type Your message..."}/>

              <View style={{ flexDirection: "row", alignItems: "center" }} >
                {!isTyping && (
                  <IconButton icon={<Icon as={Entypo} name="camera" />} borderRadius="full" _icon={{ size: "lg" }} onPress={handleImage} />
                )}
                <IconButton icon={<Icon as={Entypo} name="attachment" />} borderRadius="full" _icon={{ size: "lg" }} onPress={handleDocument}/>
              </View>

              {isTyping ? (
                  <IconButton icon={<Icon as={Ionicons} name="send-outline" />} borderRadius="full" _icon={{ size: "lg" }} onPress={()=>sendMessage("text")}/>
              ) : (
                  <IconButton icon={<Icon as={Entypo} name="mic" />} borderRadius="full" _icon={{ size: "lg" }}/>
              )}
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

  fullScreenImage: {
    width: '100%', // Full width of the screen
    height: '100%', // Full height of the screen
    resizeMode: 'contain', // Maintain aspect ratio of the image
  },
});