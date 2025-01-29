/**
 * MessageScreen.js
 *
 * This file contains a custom audio player component. 
 * The audio slider functionality has been implemented based on code from:
 * 
 * Copyright (c) 2021 Vincent Lohse
 * 
 * Based on code from https://github.com/olapiv/expo-audio-player/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { StyleSheet, View, ScrollView, KeyboardAvoidingView, TextInput, Image, Modal, Platform,Linking,} from "react-native";
import React, { useState, useContext, useLayoutEffect, useEffect,useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserType } from "../Context/UserContext";
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { Box,Heading,HStack,Icon,IconButton,Menu,Spinner,Text,Pressable, useToast, Avatar, Divider, Flex, FlatList } from "native-base";
import * as ImagePicker from "expo-image-picker"
import { Video, Audio } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { io } from "socket.io-client";
import moment from 'moment';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AudioSlider from "../components/AudioSlider";
import ConfirmationDialog from "../components/ConfirmationDialog";
import useBackHandler from "../components/CustomBackHandler";

const MessageSrceen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showUnStar, setShowUnStar]=useState(false);
  const [isReplyPressed, setIsReplyPressed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [viewOnceSelected, setViewOnceSelected]=useState(false);

  const [selectedFile, setSelectedFile] = useState(null); // Store the selected file
  const [messageType, setMessageType] = useState(null);
 
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sound, setSound] = useState();

  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("")
  const [message, setMessage] = useState("");

  const [starredMessages, setStarredMessages] = useState([]);
  const [getMessage, setGetMessage]=useState([]);
  const [seletedMessages,setSelectedMessages]=useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const socket = useRef();
  const {userId, setUserId} = useContext(UserType);
  const flatListRef = useRef(null);

  const [replyMessage, setReplyMessage]=useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [highLight, setHighLight]=useState(null);
  const [document, setDocument] = useState(null);
  const toast = useToast();

  const { senderId, recipentId, userName,isGroupChat, groupName, groupId,userImage, groupImage, highlightedMessageId } = route.params || {};
  
  const baseUrl = `${mainURL}/files/`;
  const imageUrl = userImage ? userImage : groupImage;
  const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
  const filename = normalizedPath.split('/').pop();

  const source = userImage || groupImage ? { uri: baseUrl + filename } : null;

  const [isDeleteMessagesOpen, setIsDeleteMessagesOpen] = useState(false); // State for the first dialog
  const [isDeleteChatOpen, setIsDeleteChatOpen] = useState(false); // State for the second dialog


  useBackHandler('Home');

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);
  
  useEffect(() => {
    if (highlightedMessageId) {
        handleReplyPress(highlightedMessageId);
    }
  }, [highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId && getMessage.length > 0) {
      const index = getMessage.findIndex((msg) => msg._id === highlightedMessageId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
        
      }
    }
  }, [highlightedMessageId, getMessage]);

  const fetchMessages = async()=>{
    try {
      const url = senderId
        ? isGroupChat
        ? `${mainURL}/get-group-messages/${groupId}` : `${mainURL}/get-messages/${senderId}/${recipentId}`
        : isGroupChat
      ? `${mainURL}/get-group-messages/${groupId}` : `${mainURL}/get-messages/${userId}/${recipentId}`;
        const response = await axios.get(url).then((res) => {

          const messages = res.data.message.filter(
            (message) => !message.clearedBy.includes(userId)
          );
          setGetMessage(messages.reverse());
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
    fetchMessages();
  }, []);

  //console.log(JSON.stringify(getMessage, null, 2))

  const updateImageViewed = (messageId) => {
    setGetMessage((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId ? { ...msg, imageViewed: true } : msg
      )
    );
  };
  
  const updateVideoViewed = (messageId) => {
    setGetMessage((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId ? { ...msg, videoViewed: true } : msg
      )
    );
  };

  useEffect(() => {
    socket.current = io(mainURL);

    socket.current.on("connect", () => {
      socket.current.emit("joinRoom", userId);
      socket.current.emit("joinRoom", groupId);
    });

    socket.current.on("newMessage", (message) => {
      console.log(message)
      setGetMessage((prevMessages) => [message, ...prevMessages]);
    });

      socket.current.on("imageViewedUpdate", (messageId) => {
        
        updateImageViewed(messageId._id);
      });

      socket.current.on("videoViewedUpdate", (messageId) => {
        
        updateVideoViewed(messageId._id);
      });

    return () => {
      socket.current.disconnect();
    };
  }, [userId]);

  const handleVideoPress = async(videoUrl, item) => {
    

    if(item.videoViewOnce){
      if(item.senderId._id===userId){
        toast.show({
          description: "Confidential",
          duration: 2000,  // Set a duration for the toast to display
        });
        return;
      }
      setSelectedVideo(videoUrl);
      const formData = {
        videoViewed : true,
        id: item._id
      }
      
      try {
        const response = await axios.patch(`${mainURL}/viewedVideoOnce/true`, formData);
        
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
    }else{
      setSelectedVideo(videoUrl);
    }
  };

  //console.log(JSON.stringify(getMessage, null, 2))
  const handleImagePress = async(imageUrl, item) => {

    if(item && item.imageViewOnce){
      if(item.senderId._id===userId){
        toast.show({
          description: "Confidential",
          duration: 2000,  // Set a duration for the toast to display
        });
        return;
      }
      setSelectedImage(imageUrl);
      const formData = {
        imageViewed : true,
        id: item._id
      }
      
      try {
        const response = await axios.patch(`${mainURL}/viewedImageOnce/true`, formData);
        
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
    }else{
      console.log("Normal image",imageUrl)
      setSelectedImage(imageUrl);
    }
    
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
              {source ? <Avatar size="35px"marginRight={2} source={source}/> : <Ionicons name="person-circle-outline" size={35} color="gray" />}
              <Pressable width={"64"} onPress={() => {
                  if (isGroupChat) {
                    viewUsersProfile(groupId); 
                  }}}>
                {({
                isHovered,
                isFocused,
                isPressed
              }) => {
                return <Box justifyContent={"center"} h={"full"} bg={isPressed ? "coolGray.200" : isHovered ? "coolGray.200" : "white"}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                        {!isGroupChat ? userName : groupName}
                      </Text>
                    </Box>;
              }}
              </Pressable>
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
            <IconButton icon={<Icon as={Entypo} name="trash" />} color="black"  onPress={() => setIsDeleteMessagesOpen(true)}  />
            <IconButton icon={<Icon as={Ionicons} name="arrow-redo-sharp" />} color="black" onPress={() => navigation.navigate('MessageForwardScreen', { 
              seletedMessages: seletedMessages,} )} />
          </Box>
        ) : (
          <Box w="90%" alignItems="flex-end" paddingRight={4}>
            <Menu w="190" trigger={triggerProps => {
                return <Pressable accessibilityLabel="More options menu" {...triggerProps} >
                        <Entypo name="dots-three-vertical" size={20} color="black" />
                      </Pressable>}}>
              <Menu.Item onPress={() => setIsDeleteChatOpen(true)}>Clear Chat</Menu.Item>
            </Menu>
          </Box>
        ),
    });
  }, [navigation, seletedMessages, Platform.OS, userName]);

  function viewUsersProfile(groupId){
    navigation.navigate('UsersProfileScreen', {groupId})
  }

  const handleClearChatConfirm = async () => {
    // Call deleteMessage with the selected messages
    await handleClearChat();
    setIsDeleteChatOpen(false); // Close the dialog after deletion
  };

  
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
  
  const handleDeleteConfirm = async () => {
    // Call deleteMessage with the selected messages
    await deleteMessage(seletedMessages);
    setIsDeleteMessagesOpen(false); // Close the dialog after deletion
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

  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  function handleInputChange (enteredValue) {
      setMessage(enteredValue);
      setIsTyping(enteredValue.length > 0);
  };
  
  const sendMessage= async(messageType, fileUri, duration, fileName, replyMessageId = replyMessage?._id) =>{

    setIsSending(true); 
    setErrorMessage(""); 
    console.log("message sent",message);
      try {
          const formData = new FormData()
          formData.append("senderId",userId);
          if(!isGroupChat){
            formData.append("recepientId",recipentId);
          }else{
            formData.append("recepientId",groupId);
          }
          
          if (replyMessageId) {
            formData.append("replyMessage", replyMessageId);
          }
          
          
          if (messageType === "image" || messageType === "video") {
            formData.append("messageType", messageType);
            
            if(messageType === "image"){
              formData.append("imageViewOnce", viewOnceSelected);
            }else if(messageType === "video"){
              formData.append("videoViewOnce", viewOnceSelected);
            }
            
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
          } else if (messageType === "audio") {
            formData.append("messageType", messageType);
            formData.append("duration", duration);
            formData.append("file", {
              uri: fileUri,
              name: "audio.3gp", 
              type: "audio/3gp",  
              
            });
          }
          else {
              // Default to text if no file type is provided
              formData.append("messageType", "text");
              formData.append("message", message.trim());
          }

          if (isGroupChat && groupId) {
            formData.append("isGroupChat", isGroupChat);
            formData.append("groupId", groupId);
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

          if(!isGroupChat){
            console.log("end to end chat")
            socket.current.emit("send_message", {
              senderId: userId,
              receiverId: recipentId,
              message: message,
              isGroupChat: isGroupChat,
              timestamp: new Date().toISOString(),
            });
          }else{
            console.log("group chat")
            socket.current.emit("send_message", {
              senderId: userId,
              receiverId: groupId,
              message: message,
              isGroupChat: isGroupChat,
              timestamp: new Date().toISOString(),
            });
          }
          
      } catch (error) {
          if (error.response && error.response.data.error) {
              setErrorMessage(error.response.data.error);
          } else if (error.request) {
              console.log('Network Error:', error.request);
              setErrorMessage("Network Error: Please check your internet connection.");
          } else {
            setErrorMessage("Upload Error Something went wrong. Please try again.");
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
      if(!result.canceled){
          const asset = result.assets[0];
          const isVideo = asset.type === 'video';

          setMessageType(isVideo ? 'video' : 'image');
          setSelectedFile({
            uri: asset.uri,
            duration: asset.duration || null, // Only for video
            fileName: asset.fileName || null,
          });
      }
  }

  const handleSendFileMessage = () => {
    if (selectedFile) {
      sendMessage(
        messageType,
        selectedFile.uri,
        selectedFile.duration,
        selectedFile.fileName
      );
      setSelectedFile(null); // Clear the selected file after sending
      setMessageType(null);
    }
  };
  

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
      if(!result.canceled){
        const asset = result.assets[0];
        const mimeType = asset.mimeType;
        const fileName = asset.name; 
        let docType = '';
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


  const handleViewOnceClick = () => {
    setViewOnceSelected(prevState => !prevState);
  };
  
  let isRecordingInProgress = false; // Add a flag to prevent simultaneous calls

  const voiceRecordHandle = async () => {
    console.log("Voice recording started");

    if (isRecordingInProgress) {
      console.log("Recording is already in progress.");
      return;
    }

    try {
      isRecordingInProgress = true;

      if (recording) {
        console.log("Stopping the previous recording...");
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert("You need to enable microphone permissions to use this feature.");
        isRecordingInProgress = false;
        return;
      }

      // Prepare for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);

      console.log("Recording started successfully.");
    } catch (err) {
      console.error("Failed to start recording", err);
    } finally {
      isRecordingInProgress = false;
    }
  };

  const getFileSize = async (fileUri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log("File Size in Bytes:", fileInfo.size);
        return fileInfo.size; // Size in bytes
      } else {
        console.log("File does not exist.");
      }
    } catch (err) {
      console.error("Failed to get file size:", err);
    }
  };
  
  const getAudioDuration = async (uri) => {
    try {
      const { sound, status } = await Audio.Sound.createAsync({ uri });
      if (status.isLoaded) {
        await sound.unloadAsync(); // Unload after retrieving duration
        return status.durationMillis;
      } else {
        console.log("Failed to load audio file for duration.");
      }
    } catch (error) {
      console.error("Error retrieving audio duration:", error);
    }
  };

  const voiceStopRecordHandle = async () => {
    if (!recording) {
      console.log("No recording is in progress.");
      return;
    }

    try {
      await recording.stopAndUnloadAsync(); 
      const uri = recording.getURI(); 
      setRecordingUri(uri);
      setRecording(null);

      if (!uri) {
        console.log("Recording URI not available. The recording might not have been stopped properly.");
        return;
      }

      const recordingStatus = await recording.getStatusAsync();
      console.log("recordingStatus",recordingStatus)
      const duration = await getAudioDuration(uri);
      if (duration) {
        console.log("Audio Duration (ms):", duration);
      }

      getFileSize(recording._uri);
      const fileExtension = uri.split('.').pop();
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileName = `audio_${Date.now()}.m4a`;
      sendMessage("audio", uri, duration, fileName);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const handleReplyPress = (messageId) => {
    const index = getMessage.findIndex((message) => message._id === messageId);

    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ animated: true, index });
      setHighLight(messageId);
      setTimeout(() => {
        setHighLight(null); // Remove highlight after a delay
      }, 2000);
    } else {
      console.warn('Message not found in the list.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
       <FlatList
          data={getMessage}
          ref={flatListRef}
          inverted
          keyExtractor={(item) => item._id.toString()}
          initialNumToRender={10} 
          maxToRenderPerBatch={15}
          getItemLayout={(item, index) => ({
            length: 120, // Replace 60 with the fixed height of each item
            offset: 120 * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const currentDate = formatDate(item.timeStamp);
            const previousDate = index < getMessage.length - 1 ? formatDate(getMessage[index + 1].timeStamp) : null;
            const showDateSeparator = currentDate !== previousDate;
            if(item.messageType === 'text'){
              const isSelected = seletedMessages.includes(item._id)
              const baseUrl = `${mainURL}/files/`;
              const imageUrl= item.replyMessage?.imageUrl;
              const normalizedPath = imageUrl?.replace(/\\/g, "/"); 
              const filename=normalizedPath?.split("/").pop();
              const source = {uri: baseUrl + filename}
              
              const profileImageUrl = item?.senderId?.image;
              const normalizedProfileImagePath = profileImageUrl ? profileImageUrl.replace(/\\/g, '/') : '';
              const profileImageFilename = normalizedProfileImagePath.split('/').pop();
  
              const profileImageSource =  item.senderId.image ? { uri: baseUrl + profileImageFilename } : null;
                return(
                  <View key={item._id}>
                    {showDateSeparator ? (
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
                    ) : null}
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
                      {item.replyMessage?.messageType==='text' ? 
                        <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                          style={{ backgroundColor: "#E0FFE8", padding: 8, borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",}}>
                          <Text color={"violet.800"} fontWeight={"semibold"}>
                              {item?.replyMessage?.senderId?._id ===userId ? "You" : item?.replyMessage?.senderId?.user_name}
                          </Text>
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
                            
                        </Pressable>: item.replyMessage?.messageType==='audio' ? 
                        <Pressable onPress={() => handleReplyPress(item.replyMessage._id)} 
                          style={{ backgroundColor: "#E0FFE8", borderRadius: 5, borderLeftWidth: 4, borderLeftColor: "#2E7800",padding:2}}>
                            <Box >
                              <Flex direction="row" h="38"alignItems="center"  >
                                <Entypo name="mic" size={10} color="black" style={{paddingHorizontal:5}}/>
                                
                                <Text 
                                  style={{ fontSize: 12, fontWeight: "500", color: "#333" }} >
                                   voice message
                                </Text>
                                <Divider bg="black" thickness="2" mx="1" h={5} orientation="vertical" />
                                <Text style={{ fontSize: 12, fontWeight: "500", color: "#333" }}>{formatDuration(item.replyMessage.duration)}</Text>
                              </Flex>
                            </Box>
                            
                        </Pressable> : item.replyMessage?.messageType==='pdf' || item.replyMessage?.messageType==='docx' ||
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
                            
                        </Pressable>: null
                      }
                      <Box>
                        <Box flexDirection={"row"} paddingBottom={2}>
                          {!item.replyMessage ? profileImageSource ? 
                            <Avatar size="xs" source={profileImageSource}/> : 
                            <Ionicons name="person-circle-outline" size={25} color="grey" /> : null}
                        
                          {!item.replyMessage && <Text
                            color={"blue.900"} fontWeight={"semibold"} paddingLeft={2}>
                              {item?.senderId?._id ===userId ? "You" : item?.senderId?.user_name}
                          </Text>}
                        </Box>
                        <Text>{item?.message}</Text>
                      </Box>
                      
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
                      maxWidth:'60%',
                      margin:10,
                      borderRadius:7
                  } : {
                      alignSelf:'flex-start',
                      backgroundColor:'white',
                      margin:10,
                      maxWidth:'60%',
                      borderRadius:7
                  },highlightedMessageId === item._id && { borderColor: "#2E7800", borderWidth: 2 }, 
                ]} onLongPress={()=> handleSelectedMessage(item)}  onPress={() => {
                  if (item.imageViewOnce) {
                    handleImagePress(source, item);
                  } else {
                    handleImagePress(source,null);
                  }
                }} >
                  
                    {item.imageViewOnce ? (
                      <>
                      <Box flexDirection="row"alignItems="center" paddingLeft={2} paddingRight={2} paddingTop={2} >
                        <MaterialCommunityIcons
                          name={item.imageViewed ? 'circle' : 'numeric-1-circle-outline'}
                          size={14}
                          color={item.imageViewed ? 'grey' : '#219BC7'}
                          style={{
                            marginRight: 5,
                          }}
                        />
                        <Text
                        
                          style={{
                            fontSize: 14,
                            color: item.imageViewed ? 'grey' : '#219BC7',
                            fontWeight: "500",
                          }}
                        >
                          {item.imageViewed ? "Opened" : "Photo"}
                        </Text>
                      </Box>
                      <Box
                      flexDirection="row"
                      justifyContent="flex-end"
                      paddingRight={2}
                       >
                      <Text
                        style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "black" }]}
                      >
                        {formatTime(item.timeStamp)}
                      </Text>
                      {item?.starredBy[0] === userId && (
                        <Entypo
                          name="star"
                          size={14}
                          color="white"
                          
                        />
                      )}
                    </Box>
                      </>
                      
                      
                    ) : (
                      <>
                      <Image
                        source={source}
                        style={{ width: 200, height: 200, borderRadius: 7 }}
                        onError={(error) => console.log("Image Load Error:", error)}
                      />
                      <Box
                      flexDirection="row"
                      justifyContent="flex-end"
                      paddingRight={2}
                      alignItems="center" style={{
                        position: 'absolute',
                        bottom: 10, 
                        right: 10, 
                      }} >
                      <Text
                        style={[styles.infoText,{ color: item?.senderId?._id === userId ? "white" : "white" }]}
                      >
                        {formatTime(item.timeStamp)}
                      </Text>
                      {item?.starredBy[0] === userId && (
                        <Entypo
                          name="star"
                          size={14}
                          color="white"
                          style={{
                            marginLeft: 10,
                          }}
                        />
                      )}
                    </Box>
                      </>
                      
                    )}
  
                    
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
                    ]} onPress={() => handleVideoPress(source,item)}  onLongPress={()=> handleSelectedMessage(item)}>
                      
                          {item.videoViewOnce ? (
                          <Box flexDirection="row"alignItems="center" paddingLeft={2} paddingRight={2} paddingTop={2} >
                            <MaterialCommunityIcons
                              //name="numeric-1-circle"
                              name={item.videoViewed ? 'circle' : 'numeric-1-circle-outline'}
                              size={14}
                              color={item.videoViewed ? 'grey' : '#219BC7'}
                              style={{
                                marginRight: 5,
                              }}
                            />
                            <Text
                            
                              style={{
                                fontSize: 14,
                                color: item.videoViewed ? 'grey' : '#219BC7',
                                fontWeight: "500",
                              }}
                            >
                              {item.videoViewed ? "Opened" : "Video"}
                            </Text>
                          </Box>
                        ) : (
                          <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>{item.videoName}</Text>
                        )}
                        
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
              if(item.messageType==="audio"){
                const baseUrl = `${mainURL}/files/`;
                const audioUrl= item.audioUrl;
                const normalizedPath = audioUrl.replace(/\\/g, "/"); 
                const filename=normalizedPath.split("/").pop();
                const source = {uri: baseUrl + filename}
  
                return(
                  <View key={index}>
                      {showDateSeparator && (
                        <Text style={{alignSelf: 'center',backgroundColor: '#333',color: 'white',padding: 5, borderRadius: 10, marginVertical: 10,}}>
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
                        ]} onLongPress={() => handleSelectedMessage(item)}>
                        <View >
                            <AudioSlider audio={source}/>
                        </View>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                          <Text 
                            style={[
                              styles.infoText,
                              { color: item?.senderId?._id === userId ? "white" : "black" }
                            ]}
                          >
                            {formatDuration(item.duration)}
                          </Text>
  
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
  
                      </Pressable>
                  </View>
                )
              }
            
    
            
          }} />
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
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#dddddd",
          marginBottom: showEmojiSelector ? 0 : 25,}}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {replyMessage && <ReplyMessageView />}

          <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
            <TextInput
              value={
                selectedFile
                  ? selectedFile.fileName || (messageType === "image" ? "Image" : "Video")
                  : replyMessage || message 
              }
              onChangeText={handleInputChange}
              style={{
                flex: 1,
                height: 40,
                borderWidth: 1,
                borderColor: "#dddddd",
                borderRadius: 20,
                paddingHorizontal: 10,
              }}
              placeholder="Type Your message..."
              editable={!selectedFile} 
            />

              { !selectedFile &&
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {!isTyping && (
                    <IconButton
                      icon={<Icon as={Entypo} name="camera" />}
                      borderRadius="full"
                      _icon={{ size: "lg" }}
                      onPress={handleImage}
                    />
                  )}
                  <IconButton
                    icon={<Icon as={Entypo} name="attachment" />}
                    borderRadius="full"
                    _icon={{ size: "lg" }}
                    onPress={handleDocument}
                  />
                  
                </View>
              }
            {selectedFile ? (
              <>
              <IconButton
                icon={<Icon as={MaterialCommunityIcons} name={viewOnceSelected ? 'numeric-1-circle' : 'numeric-1-circle-outline'} />}
                borderRadius="full"
                _icon={{ size: "lg" }}
                onPress={handleViewOnceClick}
              />
              <IconButton
                icon={<Icon as={Ionicons} name="send-outline" />}
                borderRadius="full"
                _icon={{ size: "lg" }}
                onPress={handleSendFileMessage}
              />
              </>
              
            ) : isTyping ? (
              <IconButton
                icon={<Icon as={Ionicons} name="send-outline" />}
                borderRadius="full"
                _icon={{ size: "lg" }}
                onPress={() => sendMessage("text")}
              />
            ) : (
              <IconButton
                icon={<Icon as={Entypo} name="mic" color={"white"}/>}
                borderRadius="full"
                background={"green.800"}
                _icon={{ size: "lg", color: "green" }}
                _pressed={{
                  transform: [{ scale: 1.5 }],
                }}
                onPressIn={() => {
                  setTimeout(() => voiceRecordHandle(), 200); 
                }}
                onPressOut={() => {
                  setTimeout(() => voiceStopRecordHandle(), 500); 
                }}
              />
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
      <ConfirmationDialog
        isOpen={isDeleteMessagesOpen} 
        onClose={() => setIsDeleteMessagesOpen(false)}
        onConfirm={handleDeleteConfirm}
        header="Delete Messages"
        body="Are you sure you want to delete the selected messages? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Second ConfirmationDialog */}
      <ConfirmationDialog
        isOpen={isDeleteChatOpen} 
        onClose={() => setIsDeleteChatOpen(false)}
        onConfirm={handleClearChatConfirm}
        header="Delete Customer"
        body="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </KeyboardAvoidingView>
  );
};

export default MessageSrceen;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
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

  fullScreenImage: {
    width: '100%', // Full width of the screen
    height: '100%', // Full height of the screen
    resizeMode: 'contain', // Maintain aspect ratio of the image
  },
  slider: {
    width: '90%',
    height: 40,
  },
});