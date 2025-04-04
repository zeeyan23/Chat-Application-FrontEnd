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

import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
  Image,
  Modal,
  Platform,
  Linking,
  Animated,
  PanResponder,
  Alert,
  ActionSheetIOS,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import {
  useState,
  useContext,
  useLayoutEffect,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserType } from "../Context/UserContext";
import axios from "axios";
import { mainURL } from "../Utils/urls";
import {
  Box,
  Heading,
  HStack,
  Icon,
  IconButton,
  Menu,
  Spinner,
  Text,
  Pressable,
  useToast,
  Avatar,
  Divider,
  Flex,
  FlatList,
  Actionsheet,
  Checkbox,
  Button,
} from "native-base";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import moment from "moment";
import * as DocumentPicker from "expo-document-picker";
import AudioSlider from "../components/AudioSlider";
import ConfirmationDialog from "../components/ConfirmationDialog";
import useBackHandler from "../components/CustomBackHandler";
import { ImageBackground } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import MessageDeleteDialog from "../components/MessagesDeleteDialog";
import socketInstance from "../Utils/socket";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { compress } from "react-native-video-compressor";
const MessageSrceen = () => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showUnStar, setShowUnStar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [viewOnceSelected, setViewOnceSelected] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const [sound, setSound] = useState();

  const [errorMessage, setErrorMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [message, setMessage] = useState("");

  const [starredMessages, setStarredMessages] = useState([]);
  const [getMessage, setGetMessage] = useState([]);
  const [seletedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const socket = socketInstance.getSocket();
  const { userId, setUserId } = useContext(UserType);
  const flatListRef = useRef(null);

  const [replyMessage, setReplyMessage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [highLight, setHighLight] = useState(null);
  const toast = useToast();

  const {
    senderId,
    recipentId,
    userName,
    isGroupChat,
    groupName,
    groupId,
    userImage,
    groupImage,
    highlightedMessageId,
  } = route.params || {};

  const [refreshKey, setRefreshKey] = useState(0);

  const baseUrl = `${mainURL}/files/`;
  const imageUrl = userImage ? userImage : groupImage;
  const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, "/") : "";
  const filename = normalizedPath.split("/").pop();
  const source = userImage || groupImage ? { uri: baseUrl + filename } : null;

  const [isDeleteMessagesOpen, setIsDeleteMessagesOpen] = useState(false);
  const [isDeleteChatOpen, setIsDeleteChatOpen] = useState(false);
  const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);
  const [groupChatInfo, setGroupChatInfo] = useState(null);
  const [selectedAudience, setSelectedAudience] = useState([]);

  const [text, setText] = useState("");
  const [test, setTest] = useState("");
  const [disappearMessage, setDisAppearMessage] = useState(false);
  const [disappearMessageTime, setDisAppearMessageTime] = useState("");
  const agoraEngineRef = useRef(null);
  const eventHandler = useRef(null);
  const [dial, setDial] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenVideoCall, setIsOpenVideoCall] = useState(false);
  const [status, setStatus] = useState({
    isOnline: false,
    lastOnlineTime: null,
  });
  useBackHandler("Home");

  const [hasPermission, setHasPermission] = useState(false);
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  let animationRef = useRef(null);
  const [timer, setTimer] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [userStatus, setUserStatus] = useState({
    isOnline: false,
    lastOnlineTime: null,
  });
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const animatedFlex = useRef(
    new Animated.Value(Platform.OS === "android" ? 1 : 0.98)
  ).current;
  useEffect(() => {
    const interval = setInterval(() => {
      if (!socket.connected) socket.connect();
    }, 10000);

    socket.on("disconnect", () => {
      console.warn("Socket disconnected! Reconnecting...");
      setTimeout(() => socket.connect(), 2000);
    });

    return () => {
      clearInterval(interval);
      socket.off("disconnect");
    };
  }, []);
  useEffect(() => {
    fetchMessages();
  }, []);
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardStatus(true);
        Animated.timing(animatedFlex, {
          toValue: Platform.OS === "android" ? 0.55 : 0.8,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardStatus(false);
        console;
        Animated.timing(animatedFlex, {
          toValue: Platform.OS === "android" ? 1 : 0.98,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (dial || incomingCall) {
      navigation.setOptions({ headerShown: false }); // Hide header
    } else {
      navigation.setOptions({ headerShown: true });
    }
  }, [dial, incomingCall]);

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
      const index = getMessage.findIndex(
        (msg) => msg._id === highlightedMessageId
      );
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 1,
        });
      }
    }
  }, [highlightedMessageId, getMessage]);

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      console.log(status)

      setHasPermission(status === "granted");
      
    };

    requestPermission();
  }, []);
  const fetchMessages = async () => {
    try {
      const url = senderId
        ? isGroupChat
          ? `${mainURL}/message/get-group-messages/${groupId}`
          : `${mainURL}/message/get-messages/${senderId}/${recipentId}`
        : isGroupChat
        ? `${mainURL}/message/get-group-messages/${groupId}`
        : `${mainURL}/message/get-messages/${userId}/${recipentId}`;
      const startTime = Date.now(); // Record start time

      console.log("request sent");
      const response = await axios.get(url).then((res) => {
        console.log("response :", res);
        const messages = res.data.message.filter(
          (message) => !message.clearedBy.includes(userId)
        );
        console.log("messages :", messages);
        const endTime = Date.now(); // Record end time
        console.log(`Response received after ${endTime - startTime} ms`);
        setGetMessage(messages.reverse());
      });
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    }
  };

  // const fetchChatSettings = async()=>{
  //   try {
  //     const response = await axios.get(`${mainURL}/chat/get_chat_settings/${userId}/${recipentId}`);
  //     setDisAppearMessage(response.data.messageShouldDisappear);
  //     setDisAppearMessageTime(response.data.messageDisappearTime);
  //   } catch (error) {
  //       console.log('Error:', error);
  //       if (error.response) {
  //           console.log('Server Error:', error.response.data);
  //       } else if (error.request) {
  //           console.log('Network Error:', error.request);
  //       } else {
  //           console.log('Other Error:', error.message);
  //       }
  //   }
  // }

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchChatSettings();
  //   }, [userId, recipentId])
  // );

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
    if (!socket.connected) socket.connect();
    socket.emit("join", userId);
    socket.on("newMessage", (message) => {
      console.log("Received message: ", message);
      setGetMessage((prevMessages) => [{ ...message }, ...prevMessages]);
      setRefreshKey((prev) => prev + 1);
    });

    socket.on("video_call_declined", () => {
      Alert.alert("Call Declined", "The recipient declined the call.");
    });

    socket.on("voice_call_declined", () => {
      Alert.alert("Call Declined", "The recipient declined the call.");
    });

    //Delete messages
    socket.on("messages_deleted_for_me", ({ messages }) => {
      setSelectedMessages([]);
      fetchMessages();
    });

    socket.on("messages_deleted_for_both", () => {
      setSelectedMessages([]);
      fetchMessages();
    });

    //Image and Video view once
    socket.on("imageViewedUpdate", (messageId) => {
      updateImageViewed(messageId._id);
    });

    socket.on("videoViewedUpdate", (messageId) => {
      updateVideoViewed(messageId._id);
    });

    return () => {
      // socket.off("newMessage");

      socket.off("video_call_declined");
      socket.off("messages_deleted_for_me");
      socket.off("messages_deleted_for_both");
      socket.off("imageViewedUpdate");
      socket.off("videoViewedUpdate");
      socket.off("voice_call_declined");
    };
  }, [userId]);

  useEffect(() => {
    if (socket) {
      socket.on(
        "update_user_status",
        ({ userId, isOnline, lastOnlineTime }) => {
          if (userId === recipentId) {
            setStatus({
              isOnline,
              lastOnlineTime: isOnline ? null : lastOnlineTime,
            }); // Update the status for the sender or recipient
          }
        }
      );
    }
    return () => {
      socket.off("update_user_status");
    };
  }, [recipentId]);

  const handleVideoPress = async (videoUrl, item) => {
    console.log(videoUrl);
    if (item.videoViewOnce) {
      if (item.senderId._id === userId) {
        toast.show({
          description: "Confidential",
          duration: 2000, // Set a duration for the toast to display
        });
        return;
      }
      setSelectedVideo(videoUrl);
      const formData = {
        videoViewed: true,
        id: item._id,
      };

      try {
        const response = await axios.patch(
          `${mainURL}/message/viewedVideoOnce/true`,
          formData
        );
      } catch (error) {
        console.log("Error:", error);
        if (error.response) {
          console.log("Server Error:", error.response.data);
        } else if (error.request) {
          console.log("Network Error:", error.request);
        } else {
          console.log("Other Error:", error.message);
        }
      }
    } else {
      setSelectedVideo(videoUrl);
    }
  };

  const handleImagePress = async (imageUrl, item) => {
    if (item && item.imageViewOnce) {
      if (item.senderId._id === userId) {
        toast.show({
          description: "Confidential",
          duration: 2000, // Set a duration for the toast to display
        });
        return;
      }
      setSelectedImage(imageUrl);
      const formData = {
        imageViewed: true,
        id: item._id,
      };

      try {
        const response = await axios.patch(
          `${mainURL}/message/viewedImageOnce/true`,
          formData
        );
      } catch (error) {
        console.log("Error:", error);
        if (error.response) {
          console.log("Server Error:", error.response.data);
        } else if (error.request) {
          console.log("Network Error:", error.request);
        } else {
          console.log("Other Error:", error.message);
        }
      }
    } else {
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

  const onOpen = async () => {
    try {
      setIsOpen(true);
      const response = await axios.get(
        `${mainURL}/friend/get_group_members/${groupId}/${userId}`
      );
      setGroupChatInfo(response.data);
    } catch (error) {
      console.error("Error fetching chat info:", error);
    }
  };

  const onClose = () => setIsOpen(false);

  const onOpenVideoCall = async () => {
    try {
      setIsOpenVideoCall(true);
      const response = await axios.get(
        `${mainURL}/friend/get_group_members/${groupId}/${userId}`
      );
      setGroupChatInfo(response.data);
    } catch (error) {
      console.error("Error fetching chat info:", error);
    }
  };

  const onCloseVideoCall = () => setIsOpenVideoCall(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <Box flexDirection="row" alignItems="center">
          <IconButton
            icon={
              <Icon as={Ionicons} name="arrow-back-outline" color={"white"} />
            }
            size={"md"}
            onPress={() => navigation.goBack()}
          />
          {seletedMessages.length > 0 ? (
            <Text
              style={{
                fontWeight: "500",
                fontSize: 16,
                marginLeft: 10,
                color: "white",
              }}
            >
              {seletedMessages.length}
            </Text>
          ) : (
            <Box flexDirection="row" alignItems="center">
              {source ? (
                <Avatar size="35px" marginRight={2} source={source} />
              ) : (
                <Ionicons name="person-circle-outline" size={35} color="gray" />
              )}
              <Pressable
                width={"48"}
                borderBottomWidth={0.3}
                borderBottomColor= "grey"
                onPress={() => {
                  viewUsersProfile(isGroupChat ? groupId : recipentId);
                }}
              >
                {({ isHovered, isFocused, isPressed }) => {
                  return (
                    <Box
                      pl={2}
                      justifyContent={"center"}
                      h={"full"}
                      bg={
                        isPressed ? "#666666" : isHovered ? "#666666" : "black"
                      }
                      // borderBottomWidth={0.3}
                      // borderBottomColor={"white"}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "white",
                        }}
                      >
                        {!isGroupChat ? userName : groupName}
                      </Text>
                    </Box>
                  );
                }}
              </Pressable>
            </Box>
          )}
        </Box>
      ),
      headerRight: () =>
        seletedMessages.length > 0 ? (
          <Box flexDirection="row" marginRight={3}>
            <IconButton
              icon={<Icon as={Ionicons} name="arrow-undo" />}
              color="black"
              onPress={() => handleReplyMessage(seletedMessages)}
            />

            {!showUnStar ? (
              <IconButton
                icon={<Icon as={Entypo} name="star" />}
                color="black"
                onPress={() => handleStarMessage(seletedMessages)}
              />
            ) : (
              <IconButton
                icon={<Icon as={MaterialCommunityIcons} name="star-off" />}
                color="black"
                onPress={() => unstarMessage(seletedMessages)}
              />
            )}
            <IconButton
              icon={<Icon as={Entypo} name="trash" />}
              color="black"
              onPress={() => setIsDeleteMessagesOpen(true)}
            />
            <IconButton
              icon={<Icon as={Ionicons} name="arrow-redo-sharp" />}
              color="black"
              onPress={() =>
                navigation.navigate("MessageForwardScreen", {
                  seletedMessages: seletedMessages,
                })
              }
            />
          </Box>
        ) : (
          <Box
            justifyContent={"space-between"}
            flexDirection={"row"}
            alignItems={"center"}
          >
            {!isGroupChat ? (
              <>
                <Box flex={1} alignItems="center">
                  <IconButton
                    icon={
                      <Icon
                        as={Ionicons}
                        name="call-sharp"
                        color={"white"}
                        size={"lg"}
                      />
                    }
                    _hover={{ bg: "white", icon: { color: "#000B66" } }}
                    onPress={voiceCallHandle}
                  />
                </Box>
                <Box flex={1} alignItems="center">
                  <IconButton
                    icon={
                      <Icon as={Ionicons} name="videocam" color={"white"} />
                    }
                    size={"lg"}
                    _hover={{ bg: "white", icon: { color: "#000B66" } }}
                    onPress={videoCallHandler}
                  />
                </Box>
              </>
            ) : (
              <>
                <Box flex={1} alignItems="center">
                  <IconButton
                    icon={
                      <Icon
                        as={Ionicons}
                        name="call-sharp"
                        color={"white"}
                        size={"lg"}
                      />
                    }
                    _hover={{ bg: "white", icon: { color: "#000B66" } }}
                    onPress={onOpen}
                  />
                </Box>
                <Box flex={1} alignItems="center">
                  <IconButton
                    icon={
                      <Icon as={Ionicons} name="videocam" color={"white"} />
                    }
                    size={"lg"}
                    _hover={{ bg: "white", icon: { color: "#000B66" } }}
                    onPress={onOpenVideoCall}
                  />
                </Box>
              </>
            )}
            <Box flex={1} alignItems="flex-end">
              <Menu
                trigger={(triggerProps) => {
                  return (
                    <IconButton
                      accessibilityLabel="More options menu"
                      {...triggerProps}
                      icon={
                        <Icon
                          as={Entypo}
                          name="dots-three-vertical"
                          color={"white"}
                        />
                      }
                      size={"lg"}
                      _hover={{ bg: "white", icon: { color: "#000B66" } }}
                    />
                  );
                }}
              >
                <Menu.Item onPress={() => setIsDeleteChatOpen(true)}>
                  Clear Chat
                </Menu.Item>
              </Menu>
            </Box>
          </Box>
        ),
    });
  }, [navigation, seletedMessages, Platform.OS, userName, status]);

  function voiceCallHandle() {
    console.log('caller id',userId)
    socket.emit("voice_calling", {
      callerId: userId,
      calleeId: recipentId,
      isCaller: false,
    });
    navigation.navigate("VoiceScreen", {
      callerId: userId,
      calleeId: recipentId,
      isCaller: true,
    });
  }

  function groupVoiceCallHandle(userId, groupId) {
    const updatedAudience = [...selectedAudience, userId];
    socket.emit("group_voice_calling", {
      callerId: userId,
      groupId,
      isCaller: false,
      participants: updatedAudience,
    });
    navigation.navigate("VoiceScreen", {
      isGroup: true,
      userId: userId,
      groupId,
      isCaller: true,
      participants: updatedAudience,
    });
    onClose();
  }
  const toggleAudience = (id) => {
    setSelectedAudience((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function groupVideoCallHandle(userId, groupId) {
    const updatedAudience = [...selectedAudience, userId];
    socket.emit("group_video_calling", {
      callerId: userId,
      groupId,
      isCaller: false,
      participants: updatedAudience,
    });
    navigation.navigate("VideoScreen", {
      isGroup: true,
      groupId,
      userId: userId,
      isCaller: true,
      participants: updatedAudience,
    });
  }

  function videoCallHandler() {
    socket.emit("video_calling", {
      callerId: userId,
      calleeId: recipentId,
      isCaller: false,
    });

    navigation.navigate("VideoScreen", {
      callerId: userId,
      calleeId: recipentId,
      isCaller: true,
    });
  }

  function viewUsersProfile(id) {
    navigation.navigate("UsersProfileScreen", { id, isGroupChat });
  }

  const handleClearChatConfirm = async () => {
    setGetMessage([]);
    await handleClearChat();
    setIsDeleteChatOpen(false);
  };

  const handleClearChat = async () => {
    const formData = {
      userId: userId,
      otherUserId: senderId ? senderId : recipentId,
    };
    try {
      const response = await axios.post(
        `${mainURL}/chat/clear-chat/`,
        formData
      );
      const messages = response.data.filter(
        (message) => !message.clearedBy.includes(userId)
      );

      setGetMessage(messages);
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    }
  };
  const handleReplyMessage = async (messageIds) => {
    if (messageIds.length === 1) {
      const selectedMessage = getMessage.find(
        (item) => item._id.toString() === messageIds[0].messageId
      );
      setReplyMessage(selectedMessage);
      setSelectedMessages([]);
    } else {
      setReplyMessage(null);
    }
  };

  const handleStarMessage = async (messageIds) => {
    //console.log(messageIds)
    if (messageIds.length > 0) {
      try {
        await axios.patch(
          `${mainURL}/message/star-messages`,
          {
            messageIds,
            starredBy: userId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setSelectedMessages([]);
        fetchMessages();
      } catch (error) {
        console.error("Error:", error);
      }
    } else {
      setStarredMessages([]);
    }
  };

  const handleDeleteConfirm = async () => {
    await deleteMessageForBoth(seletedMessages);
    setIsDeleteMessagesOpen(false);
  };

  const handleDeleteForMe = async () => {
    await deleteMessageForMe(seletedMessages);
    setIsDeleteMessagesOpen(false);
  };

  const deleteMessageForBoth = async (messageObjects) => {
    const messageIds = messageObjects.map((msg) => msg.messageId);
    const formData = {
      messages: messageIds,
      userId: userId,
      recipentId: recipentId,
    };
    try {
      const response = await axios.post(
        `${mainURL}/message/deleteMessages/`,
        formData
      );
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    }
  };

  const deleteMessageForMe = async (messageObjects) => {
    const messageIds = messageObjects.map((msg) => msg.messageId);
    const formData = {
      messages: messageIds,
      userId: userId,
      recipentId: recipentId,
    };
    try {
      const response = await axios.post(
        `${mainURL}/message/deleteForMeMessages/`,
        formData
      );
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    }
  };

  function handleInputChange(enteredValue) {
    setMessage(enteredValue);
    setIsTyping(enteredValue.length > 0);
  }

  const sendMessage = async (
    messageType,
    fileUri,
    duration,
    fileName,
    replyMessageId = replyMessage?._id
  ) => {
    setIsSending(true);
    setText(fileUri);
    setTest(messageType);
    console.log("filename", fileName)
    try {
      const formData = new FormData();
      formData.append("senderId", userId);
      if (!isGroupChat) {
        formData.append("recepientId", recipentId);
      } else {
        formData.append("recepientId", groupId);
      }

      if (replyMessageId) {
        formData.append("replyMessage", replyMessageId);
      }

      if (messageType === "video") {
        formData.append("messageType", messageType);
        const fileExtension = fileName.split(".").pop().toLowerCase();
        const mimeType = fileExtension === "mov" ? "video/quicktime" : "video/mp4";
        const videoUri =
          Platform.OS === "android" ? fileUri : fileUri.replace("file://", "");
        formData.append("videoViewOnce", viewOnceSelected);
        formData.append("file", {
          uri: videoUri,
          name: `video.${fileExtension}`,
          type: mimeType,
        });
        formData.append("duration", duration);
        formData.append("videoName", fileName);
        console.log("formData",formData)
      } else if (messageType === "image") {
        formData.append("messageType", messageType);
        formData.append("imageViewOnce", viewOnceSelected);

        formData.append("file", {
          uri: fileUri,
          name: "image.jpeg",
          type: "image/jpeg",
        });
      } else if (
        messageType === "pdf" ||
        messageType === "docx" ||
        messageType === "xlsx" ||
        messageType === "zip" ||
        messageType === "pptx"
      ) {
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
      } else {
        formData.append("messageType", "text");
        formData.append("message", message.trim());
      }

      if (isGroupChat && groupId) {
        formData.append("isGroupChat", isGroupChat);
        formData.append("groupId", groupId);
      }
      console.log("formData :", formData);
      const response = await axios.post(
        `${mainURL}/message/messages/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("");
      setSelectedImage("");
      setReplyMessage(null);
      fetchMessages();
      setIsTyping(false);

      if (!isGroupChat) {
        socket.emit("send_message", {
          senderId: userId,
          receiverId: recipentId,
          message: message,
          isGroupChat: isGroupChat,
          timestamp: new Date().toISOString(),
        });
      } else {
        socket.emit("send_message", {
          senderId: userId,
          receiverId: groupId,
          message: message,
          isGroupChat: isGroupChat,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log("error sending message :", error);
      if (error.response && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.request) {
        console.log("Network Error:", error.request);
        setErrorMessage(
          "Network Error: Please check your internet connection."
        );
      } else {
        setErrorMessage("Upload Error Something went wrong. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  function formatTime(time) {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  }

  const formatDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
  };

  useEffect(() => {
    return () => {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.unregisterEventHandler(eventHandler);
      }
    };
  }, []);
  // const handleImage = async()=>{
  //     let result = await ImagePicker.launchImageLibraryAsync({
  //         mediaTypes: ['images', 'videos'],
  //         allowsEditing: true,
  //         aspect: [4, 3],
  //         quality: 1,
  //       });
  //     if(!result.canceled){
  //         const asset = result.assets[0];
  //         const isVideo = asset.type === 'video';
  //         setMessageType(isVideo ? 'video' : 'image');
  //         setSelectedFile({
  //           uri: asset.uri,
  //           duration: asset.duration || null, // Only for video
  //           fileName: asset.fileName || null,
  //         });
  //     }
  // }

  const handleImage = async () => {
    try {
      // Request permissions for both camera and media library
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        mediaLibraryPermission.status !== "granted"
      ) {
        Alert.alert(
          "Permission Required",
          "Camera and media library access are needed."
        );
        return;
      }

      // Show options to the user
      const options = [
        "Take Photo",
        "Record Video",
        "Choose from Library",
        "Cancel",
      ];
      const handleOption = (index) => {
        if (index === 0) openCamera("photo");
        else if (index === 1) openCamera("video");
        else if (index === 2) openMediaLibrary();
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 3,
          },
          handleOption
        );
      } else {
        const selection = await new Promise((resolve) => {
          Alert.alert(
            "Select an Option",
            "",
            [
              { text: "Take Photo", onPress: () => resolve(0) },
              { text: "Record Video", onPress: () => resolve(1) },
              { text: "Choose from Library", onPress: () => resolve(2) },
              { text: "Cancel", onPress: () => resolve(3), style: "cancel" },
            ],
            { cancelable: true }
          );
        });
        handleOption(selection);
      }
    } catch (error) {
      console.error("Error handling media:", error);
    }
  };

  // Open camera for photos or videos
  const openCamera = async (mediaType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaType === "photo" ? ["images"] : ["videos"],
        allowsEditing: true,
        quality: 0.8, // Image/Video quality (0.0 to 1.0)
      });

      // if (!result.canceled) {
      //   handleSelectedMedia(result);
      // }

      if (!result.canceled && result.assets[0].type === "video") {
        const videoUri = result.assets[0].uri;
  
        // Compress the video
        const compressedVideoUri = await compress(videoUri, {
          compressionMethod: "auto", // Auto quality adjustment
          bitrate: 800000, // Lower bitrate reduces file size
          maxSize: 10, // Max file size in MB
        });
  
        console.log("Compressed video URI:", compressedVideoUri);
  
        handleSelectedMedia({ ...result, assets: [{ ...result.assets[0], uri: compressedVideoUri }] });
      } else {
        handleSelectedMedia(result);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
    }
  };

  // Open media library for photos or videos
  const openMediaLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        handleSelectedMedia(result);
      }
    } catch (error) {
      console.error("Error opening library:", error);
    }
  };

  const getFileNameWithExtension = (uri) => {
    const fileExtension = uri.split('.').pop(); // Extract the file extension
    return `media_${Date.now()}.${fileExtension}`;
  };

  // Handle the selected media (image/video)
  const handleSelectedMedia = (result) => {
    console.log("selected file result :", result);
    const asset = result.assets[0]; // Get the first asset
    const isVideo = asset.type === "video";
    console.log("result",result)
    // Set message type (image/video)
    setMessageType(isVideo ? "video" : "image");

    // Store the media details (URI, duration, fileName)
    setSelectedFile({
      uri: asset.uri,
      duration: asset.duration || null, // Only for video
      fileName: asset.fileName || getFileNameWithExtension(asset.uri),
    });

    // console.log('Selected Media:', {
    //   uri: asset.uri,
    //   type: isVideo ? 'video' : 'image',
    //   duration: asset.duration || null,
    //   fileName: asset.fileName || null,
    // });
  };

  const handleSendFileMessage = () => {
    console.log("selectedFile",selectedFile);
    if (selectedFile) {
      console.log("selected file :", selectedFile);
      sendMessage(
        messageType,
        selectedFile.uri,
        selectedFile.duration,
        selectedFile.fileName
          ? selectedFile.fileName
          : selectedFile.uri.split("ImagePicker/")[1]
      )
        .catch((e) => console.log("error sending message:", e))
        .then((s) => console.log("message sent successfully!".s));

      setSelectedFile(null); // Clear the selected file after sending
      setMessageType(null);
    }
  };

  const checkMessageInDB = async (id, userId) => {
    try {
      const response = await axios.get(
        `${mainURL}/message/get-starred-message/${id}/${userId}`
      );
      return response.data.exists;
    } catch (error) {
      console.log("Error:", error); // Log error details
      if (error.response) {
        console.log("Server Error:", error.response.data); // Server-side error
      } else if (error.request) {
        console.log("Network Error:", error.request); // Network-related issue
      } else {
        console.log("Other Error:", error.message); // Any other error
      }
    }
  };

  const unstarMessage = async (seletedMessages) => {
    const id = seletedMessages[0]?.messageId;
    //console.log(seletedMessages)
    try {
      const response = await axios.delete(
        `${mainURL}/message/delete-starred-message/${userId}/${id}/`
      );
      if (response.status == 200) {
        setShowUnStar(false);
        fetchMessages();
        setSelectedMessages([]);
      }
    } catch (error) {
      console.log("Error:", error); // Log error details
      if (error.response) {
        console.log("Server Error:", error.response.data); // Server-side error
      } else if (error.request) {
        console.log("Network Error:", error.request); // Network-related issue
      } else {
        console.log("Other Error:", error.message); // Any other error
      }
    }
  };

  const handleSelectedMessage = async (message) => {
    try {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }

      if (!message.starredBy || message.starredBy.length === 0) {
        const isSelected = seletedMessages.some(
          (selected) => selected.messageId === message._id
        );
        if (isSelected) {
          setSelectedMessages((preMessage) =>
            preMessage.filter((item) => item.messageId !== message._id)
          );
        } else {
          setSelectedMessages((preMessage) => [
            ...preMessage,
            { messageId: message._id, senderId: message.senderId._id },
          ]);
        }
        return;
      }

      const response = await checkMessageInDB(
        message._id,
        message.starredBy[0]
      );

      if (response) {
        setShowUnStar(true);
        const isSelected = seletedMessages.some(
          (selected) => selected.messageId === message._id
        );
        if (isSelected) {
          setSelectedMessages((preMessage) =>
            preMessage.filter((item) => item.messageId !== message._id)
          );
        } else {
          setSelectedMessages((preMessage) => [
            ...preMessage,
            { messageId: message._id, senderId: message.senderId._id },
          ]);
        }
      } else {
        const isSelected = seletedMessages.some(
          (selected) => selected.messageId === message._id
        );
        if (isSelected) {
          setSelectedMessages((preMessage) =>
            preMessage.filter((item) => item.messageId !== message._id)
          );
        } else {
          setSelectedMessages((preMessage) => [
            ...preMessage,
            { messageId: message._id, senderId: message.senderId._id },
          ]);
        }
      }
    } catch (error) {
      console.log("Error:", error); // Log error details
      if (error.response) {
        console.log("Server Error:", error.response.data); // Server-side error
      } else if (error.request) {
        console.log("Network Error:", error.request); // Network-related issue
      } else {
        console.log("Other Error:", error.message); // Any other error
      }
    }
  };

  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType;
        const fileName = asset.name;
        let docType = "";
        if (mimeType === "application/pdf") {
          docType = "pdf";
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          docType = "docx";
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ) {
          docType = "pptx";
        } else if (
          mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          docType = "xlsx";
        } else if (mimeType === "application/zip") {
          docType = "zip";
        }
        console.log(
          "sending files :Doc type :",
          docType,
          "URI :",
          result.assets[0].uri,
          fileName
        );
        sendMessage(docType, result.assets[0].uri, null, fileName)
          .catch((e) => console.log("error sending message:", e))
          .then((s) => console.log("message sent successfully!".s));
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  };

  const clearReplyMessage = () => setReplyMessage(null);

  const ReplyMessageView = () => {
    let source = null;
    if (replyMessage?.messageType === "image") {
      const baseUrl = `${mainURL}/files/`;
      const imageUrl = replyMessage.imageUrl;
      const normalizedPath = imageUrl.replace(/\\/g, "/");
      const filename = normalizedPath.split("/").pop();
      source = { uri: baseUrl + filename };
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
          <Text style={{ color: "#555", fontSize: 12 }}>
            {replyMessage?.senderId?._id === userId
              ? "You"
              : replyMessage?.senderId?.user_name}
          </Text>
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

          {source && (
            <Image
              source={source}
              style={{
                width: 50,
                height: 50,
                borderRadius: 7,
              }}
              onError={(error) => console.log("Image Load Error:", error)}
            />
          )}
        </Box>
      </Box>
    );
  };

  const formatDate = (inputDate) => {
    const today = moment();
    const input = moment(inputDate);

    if (input.isSame(today, "day")) {
      return "Today";
    } else if (input.isSame(today, "week")) {
      return input.format("dddd");
    } else {
      return input.format("DD-MM-YYYY");
    }
  };

  const getIconName = (messageType) => {
    switch (messageType) {
      case "pdf":
        return "file-pdf-box";
      case "docx":
        return "file-word-box";
      case "pptx":
        return "file-powerpoint";
      case "xlsx":
        return "file-excel-box";
      case "zip":
        return "zip-box";
      default:
        return "file"; // Default icon if no match
    }
  };

  const openFile = (documentUrl) => {
    const baseUrl = `${mainURL}/files/`;
    const normalizedPath = documentUrl.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop();
    const fileUrl = baseUrl + filename;
    Linking.openURL(fileUrl).catch((err) =>
      console.error("Failed to open URL: ", err)
    );
  };

  const truncateText = (text, wordLimit) => {
    if (!text) return "";
    const words = text.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;
  };

  const handleViewOnceClick = () => {
    setViewOnceSelected((prevState) => !prevState);
  };

  const startRecordingAnimation = () => {
    if (animationRef.current) return; // Prevent multiple animations

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5, // Grow size
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1, // Shrink back
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  };

  const stopRecordingAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    scaleAnim.setValue(1); // Reset scale
  };

  const voiceRecordHandle = async () => {
    console.log(hasPermission)
    // if (!hasPermission) {
    //   console.log(hasPermission)
    //   Alert.alert(
    //     "Permission Denied",
    //     "Microphone permission is required to record audio."
    //   );
    //   return;
    // }


    if (isRecordingInProgress) return;

    try {
      console.log("Starting voice recording...");
      startRecordingAnimation();
      setIsRecordingInProgress(true);
      setIsRecording(true);

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // const { granted } = await Audio.requestPermissionsAsync();
      // if (!granted) {
      //   alert("You need to enable microphone permissions to use this feature.");
      //   setIsRecording(false);
      //   setIsRecordingInProgress(false);
      //   stopRecordingAnimation();
      //   return;
      // }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid:false
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await newRecording.startAsync();

      recordingRef.current = newRecording;
      console.log("Recording started successfully.");
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
      setIsRecordingInProgress(false);
      stopRecordingAnimation();
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

  const handleReplyPress = (messageId) => {
    const index = getMessage.findIndex((message) => message._id === messageId);

    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
      setHighLight(messageId);
      setTimeout(() => {
        setHighLight(null); // Remove highlight after a delay
      }, 2000);
    } else {
      console.warn("Message not found in the list.");
    }
  };

  const voiceStopRecordHandle = async () => {
    if (!recordingRef.current) {
      console.log("No recording to stop.");
      return;
    }

    try {
      console.log("Stopping recording...");
      stopRecordingAnimation();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null; // Clear reference
      setIsRecording(false);
      setIsRecordingInProgress(false);

      if (!uri) return;

      const duration = await getAudioDuration(uri);
      const fileName = `audio_${Date.now()}.m4a`;
      console.log("Audio URI:", uri, "Duration:", duration);

      sendMessage("audio", uri, duration, fileName);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      console.log("Recording cancelled.");
      stopRecordingAnimation();
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsRecordingInProgress(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        voiceRecordHandle();
      }, // Start recording on press
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (gestureState.dx < -100) {
          await cancelRecording(); // Cancel if swiped left
        } else {
          await voiceStopRecordHandle(); // Stop otherwise
        }
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const bckimage = require("../assets/test.png");

  const handlePress = (source, item) => {
    //console.log(item)
    if (isSelectionMode) {
      // If already in selection mode, toggle message selection
      handleSelectedMessage(item);
    } else {
      switch (item.messageType) {
        case "image":
          if (item.imageViewed) {
            return;
          }
          handleImagePress(source, item.imageViewOnce ? item : null);
          break;
        case "video":
          if (item.videoViewed) {
            return;
          }
          handleVideoPress(source, item);
          break;
        default:
          openFile(item.documentUrl);
      }
    }
  };

  const renderMediaStatus = ({
    viewed,
    type,
    timeStamp,
    senderId,
    userId,
    starredBy,
    formatTime,
    duration,
    formatDuration,
    name,
  }) => {
    const isSender = senderId === userId;
    const iconName = viewed ? "circle" : "numeric-1-circle-outline";
    const iconColor = viewed ? "grey" : "#219BC7";
    const label = viewed ? "Opened" : type === "image" ? "Photo" : "Video";

    return (
      <>
        <Box
          flexDirection="row"
          alignItems="center"
          paddingLeft={2}
          paddingRight={2}
          paddingTop={2}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={14}
            color={iconColor}
            style={{ marginRight: 5 }}
          />
          <Text
            style={{
              fontSize: 14,
              color: iconColor,
              fontWeight: "500",
              fontStyle: "italic", // Italic for the label
            }}
          >
            {label}
          </Text>
        </Box>

        <Box
          flexDirection="row"
          justifyContent={type === "image" ? "flex-end" : "space-between"}
          paddingRight={2}
        >
          {type === "video" && (
            <Text
              style={[
                styles.infoText,
                { color: "black", marginHorizontal: 10 },
              ]}
            >
              {formatDuration ? formatDuration(duration) : null}
            </Text>
          )}
          <Text style={[styles.infoText, { color: "black" }]}>
            {formatTime(timeStamp)}
          </Text>
          {starredBy?.includes(userId) && (
            <Entypo
              name="star"
              size={14}
              color="#828282"
              style={{ left: 5, top: 2 }}
            />
          )}
        </Box>

        {type === "video" && name && (
          <Text fontWeight="medium" fontSize="md" color="#0082BA">
            {name}
          </Text>
        )}
      </>
    );
  };

  const renderReplyMessage = (replyMessage, handleReplyPress, userId) => {
    if (!replyMessage) return null;

    const baseUrl = `${mainURL}/files/`;
    const imageUrl = replyMessage?.imageUrl;
    const normalizedPath = imageUrl?.replace(/\\/g, "/");
    const filename = normalizedPath?.split("/").pop();
    const source = { uri: baseUrl + filename };

    switch (replyMessage.messageType) {
      case "text":
        return (
          <Pressable
            onPress={() => handleReplyPress(replyMessage._id)}
            style={styles.commonStyle}
          >
            <Text color={"violet.800"} fontWeight={"semibold"}>
              {replyMessage.senderId?._id === userId
                ? "You"
                : replyMessage.senderId?.user_name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#333",
                marginTop: 2,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {truncateText(replyMessage.message, 5)}
            </Text>
          </Pressable>
        );

      case "image":
        return (
          <Pressable
            onPress={() => handleReplyPress(replyMessage._id)}
            style={styles.commonStyle}
          >
            <Image
              source={source}
              style={{ width: 50, height: 50 }}
              onError={(error) => console.log("Image Load Error:", error)}
            />
          </Pressable>
        );

      case "video":
        return (
          <Pressable
            onPress={() => handleReplyPress(replyMessage._id)}
            style={styles.commonStyle}
          >
            <Text>{replyMessage.videoName}</Text>
          </Pressable>
        );

      case "audio":
        return (
          <Pressable
            onPress={() => handleReplyPress(replyMessage._id)}
            style={styles.commonStyle}
          >
            <Flex direction="row" h="38" alignItems="center">
              <Entypo
                name="mic"
                size={10}
                color="black"
                style={{ paddingHorizontal: 5 }}
              />
              <Text style={{ fontSize: 12, fontWeight: "500", color: "#333" }}>
                voice message
              </Text>
              <Divider
                bg="black"
                thickness="2"
                mx="1"
                h={5}
                orientation="vertical"
              />
              <Text style={{ fontSize: 12, fontWeight: "500", color: "#333" }}>
                {formatDuration(replyMessage.duration)}
              </Text>
            </Flex>
          </Pressable>
        );

      case "pdf":
      case "docx":
      case "pptx":
      case "zip":
      case "xlsx":
        return (
          <Pressable
            onPress={() => handleReplyPress(replyMessage._id)}
            style={styles.commonStyle}
          >
            <MaterialCommunityIcons
              name={getIconName(replyMessage.messageType)}
              size={35}
              color="#007A33"
              style={{ marginRight: 10 }}
            />
            <Text>{replyMessage.fileName}</Text>
          </Pressable>
        );

      default:
        return null;
    }
  };

  const renderMessage = useCallback(
    (item, index) => {
      switch (item.messageType) {
        case "video":
          return renderVideoMessage(item, index);
        case "audio":
          return renderAudioMessage(item, index);
        case "image":
          return renderImageMessage(item, index);
        case "text":
          return renderTextMessage(item, index);
        default:
          return renderDocFileMessage(item, index);
      }
    },
    [handlePress, handleSelectedMessage, seletedMessages, mainURL]
  );

  const renderTextMessage = useCallback(
    (item, index) => {
      const MAX_INLINE_LENGTH = 40; // Adjust the length for "short/medium"

      const isShortMessage = message.length <= MAX_INLINE_LENGTH;
      const isSelected = seletedMessages.some(
        (selected) => selected.messageId === item._id
      );
      const profileImageUrl = item?.senderId?.image;
      const normalizedProfileImagePath = profileImageUrl
        ? profileImageUrl.replace(/\\/g, "/")
        : "";
      const profileImageFilename = normalizedProfileImagePath.split("/").pop();

      const profileImageSource = item.senderId.image
        ? { uri: baseUrl + profileImageFilename }
        : null;

      const currentDate = formatDate(item.timeStamp);
      const previousDate =
        index < getMessage.length - 1
          ? formatDate(getMessage[index + 1].timeStamp)
          : null;
      const showDateSeparator = currentDate !== previousDate;
      return (
        <View
          key={item._id}
          style={[
            isSelected && {
              backgroundColor: "#AFFF92",
              padding: 1,
              borderRadius: 10,
              opacity: 0.7,
            },
          ]}
        >
          {showDateSeparator ? (
            <Text style={styles.dateSeparator}> {currentDate} </Text>
          ) : null}
          <Pressable
            style={[
              item?.senderId?._id === userId
                ? styles.rightChatBox
                : styles.leftChatBox,
              highlightedMessageId === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
              highLight === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
            ]}
            onLongPress={() => handleSelectedMessage(item)}
            onPress={() => isSelectionMode && handleSelectedMessage(item)}
          >
            {renderReplyMessage(item.replyMessage, handleReplyPress, userId)}

            <Box>
              {/* Row 1 */}
              <HStack
                space={2}
                justifyContent="space-between"
                paddingRight={12}
              >
                <Text color="white" fontSize="lg" bold>
                  {!item.replyMessage ? (
                    profileImageSource ? (
                      <Avatar size="xs" source={profileImageSource} />
                    ) : (
                      <Ionicons
                        name="person-circle-outline"
                        size={25}
                        color="grey"
                      />
                    )
                  ) : null}
                </Text>
                <Text>{item?.message}</Text>
              </HStack>

              {/* Row 2 */}
              <HStack
                space={4}
                justifyContent="space-between"
                alignItems="center"
              >
                {/* <Box></Box> */}
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: item?.senderId?._id === userId ? "black" : "black",
                      marginLeft: "auto",
                    },
                  ]}
                >
                  {formatTime(item.timeStamp)}
                  {item?.starredBy[0] === userId && (
                    <Entypo name="star" size={10} color="#828282" />
                  )}
                </Text>
              </HStack>
            </Box>
          </Pressable>
        </View>
      );
    },
    [seletedMessages, handlePress, handleSelectedMessage, mainURL]
  );

  const renderVideoMessage = useCallback(
    (item, index) => {
      const isSelected = seletedMessages.some(
        (selected) => selected.messageId === item._id
      );
      const baseUrl = `${mainURL}/files/`;
      const videoUrl = item.videoUrl;
      const normalizedPath = videoUrl.replace(/\\/g, "/");
      const filename = normalizedPath.split("/").pop();
      const source = { uri: baseUrl + filename };

      const currentDate = formatDate(item.timeStamp);
      const previousDate =
        index < getMessage.length - 1
          ? formatDate(getMessage[index + 1].timeStamp)
          : null;
      const showDateSeparator = currentDate !== previousDate;
      return (
        <View
          key={index}
          style={[
            isSelected && {
              backgroundColor: "#AFFF92",
              padding: 1,
              borderRadius: 10,
              opacity: 0.7,
            },
          ]}
        >
          {showDateSeparator ? (
            <Text style={styles.dateSeparator}> {currentDate} </Text>
          ) : null}
          <Pressable
            key={index}
            style={[
              item?.senderId?._id === userId
                ? styles.rightChatBox
                : styles.leftChatBox,
              highlightedMessageId === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
              highLight === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
            ]}
            onPress={() => handlePress(source, item)}
            onLongPress={() => handleSelectedMessage(item)}
          >
            {item.videoViewOnce ? (
              renderMediaStatus({
                viewed: item.videoViewed,
                type: "video",
                timeStamp: item.timeStamp,
                senderId: item?.senderId?._id,
                userId,
                starredBy: item?.starredBy,
                formatTime,
                duration: item.duration,
                formatDuration,
              })
            ) : (
              <>
                <Text fontWeight={"medium"} fontSize={"md"} color={"#0082BA"}>
                  {item.videoName}
                </Text>
                <Box flexDirection={"row"} justifyContent={"space-between"}>
                  <Text style={[styles.infoText, { color: "black" }]}>
                    {formatDuration(item.duration)}
                  </Text>

                  <Box flexDirection="row" alignItems="center">
                    <Text style={[styles.infoText, { color: "black" }]}>
                      {formatTime(item.timeStamp)}
                    </Text>
                    {item?.starredBy[0] === userId && (
                      <Entypo
                        name="star"
                        size={14}
                        color="#828282"
                        style={{
                          marginLeft: 2, // Adjust spacing as needed
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Pressable>
        </View>
      );
    },
    [seletedMessages, handlePress, handleSelectedMessage, mainURL]
  );

  const renderDocFileMessage = useCallback(
    (item, index) => {
      const isSelected = seletedMessages.some(
        (selected) => selected.messageId === item._id
      );
      const currentDate = formatDate(item.timeStamp);
      const previousDate =
        index < getMessage.length - 1
          ? formatDate(getMessage[index + 1].timeStamp)
          : null;
      const showDateSeparator = currentDate !== previousDate;
      return (
        <View
          key={index}
          style={[
            isSelected && {
              backgroundColor: "#AFFF92",
              padding: 1,
              borderRadius: 10,
              opacity: 0.7,
            },
          ]}
        >
          {showDateSeparator ? (
            <Text style={styles.dateSeparator}> {currentDate} </Text>
          ) : null}

          <Pressable
            key={index}
            style={[
              item?.senderId?._id === userId
                ? styles.rightChatBox
                : styles.leftChatBox,
              highlightedMessageId === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
              highLight === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
            ]}
            onLongPress={() => handleSelectedMessage(item)}
            onPress={() => handlePress(null, item)}
          >
            <Box
              padding={2}
              borderRadius={7}
              flexDirection={"row"}
              flexWrap="wrap"
              alignItems="flex-start"
              background={"#D4D4D4"}
            >
              <MaterialCommunityIcons
                name={getIconName(item.messageType)}
                size={35}
                color="#007A33"
                style={{ marginRight: 10 }}
              />
              <Text
                fontWeight={"medium"}
                fontSize={"md"}
                color={"#0082BA"}
                numberOfLines={2}
                style={{
                  flexShrink: 1,
                  flexWrap: "wrap",
                  maxWidth: "100%",
                }}
              >
                {item.fileName}
              </Text>
            </Box>

            <Box flexDirection={"row"} justifyContent={"space-between"}>
              <Text
                style={[
                  styles.infoText,
                  { color: item?.senderId?._id === userId ? "black" : "black" },
                ]}
              >
                {item.messageType.toUpperCase()}
              </Text>

              <Box flexDirection="row" alignItems="center">
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: item?.senderId?._id === userId ? "black" : "black",
                    },
                  ]}
                >
                  {formatTime(item.timeStamp)}
                </Text>
                {item?.starredBy[0] === userId && (
                  <Entypo
                    name="star"
                    size={14}
                    color="#828282"
                    style={{
                      marginLeft: 2, // Adjust spacing as needed
                    }}
                  />
                )}
              </Box>
            </Box>
          </Pressable>
        </View>
      );
    },
    [seletedMessages, handlePress, handleSelectedMessage, mainURL]
  );

  const renderAudioMessage = useCallback(
    (item, index) => {
      const isSelected = seletedMessages.some(
        (selected) => selected.messageId === item._id
      );
      const baseUrl = `${mainURL}/files/`;
      const audioUrl = item.audioUrl;
      const normalizedPath = audioUrl.replace(/\\/g, "/");
      const filename = normalizedPath.split("/").pop();
      const source = { uri: baseUrl + filename };

      const profileImageUrl = item?.senderId?.image;
      const normalizedProfileImagePath = profileImageUrl
        ? profileImageUrl.replace(/\\/g, "/")
        : "";
      const profileImageFilename = normalizedProfileImagePath.split("/").pop();

      const profileImageSource = item.senderId.image
        ? { uri: baseUrl + profileImageFilename }
        : null;

      const currentDate = formatDate(item.timeStamp);
      const previousDate =
        index < getMessage.length - 1
          ? formatDate(getMessage[index + 1].timeStamp)
          : null;
      const showDateSeparator = currentDate !== previousDate;

      return (
        <View
          key={index}
          style={[
            isSelected && {
              backgroundColor: "#AFFF92",
              padding: 1,
              borderRadius: 10,
              opacity: 0.7,
            },
          ]}
        >
          {showDateSeparator ? (
            <Text style={styles.dateSeparator}> {currentDate} </Text>
          ) : null}
          <Pressable
            key={index}
            style={[
              item?.senderId?._id === userId
                ? styles.rightChatBox
                : styles.leftChatBox,
              highlightedMessageId === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
              highLight === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
            ]}
            onLongPress={() => handleSelectedMessage(item)}
            onPress={() => isSelectionMode && handleSelectedMessage(item)}
          >
            <Box
              width={"56"}
              borderRadius="lg"
              alignSelf={
                item?.senderId?._id === userId ? "flex-end" : "flex-start"
              }
              p={2}
            >
              <AudioSlider audio={source} />
              <HStack space={2} alignItems="center">
                <Box flex={1}></Box>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: item?.senderId?._id === userId ? "black" : "black",
                    },
                  ]}
                >
                  {formatDuration(item.duration)}
                </Text>
                <HStack alignItems="center" space={1}>
                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          item?.senderId?._id === userId ? "black" : "black",
                      },
                    ]}
                  >
                    {formatTime(item.created_date)}
                  </Text>
                  {item?.starredBy[0] === userId && (
                    <Entypo name="star" size={14} color="#828282" />
                  )}
                </HStack>
              </HStack>
            </Box>
          </Pressable>
        </View>
      );
    },
    [seletedMessages, handlePress, handleSelectedMessage, mainURL]
  );

  const renderImageMessage = useCallback(
    (item, index) => {
      const isSelected = seletedMessages.some(
        (selected) => selected.messageId === item._id
      );
      const baseUrl = `${mainURL}/files/`;
      const imageUrl = item.imageUrl;
      const normalizedPath = imageUrl.replace(/\\/g, "/");
      const filename = normalizedPath.split("/").pop();
      const source = { uri: baseUrl + filename };
      const currentDate = formatDate(item.timeStamp);
      const previousDate =
        index < getMessage.length - 1
          ? formatDate(getMessage[index + 1].timeStamp)
          : null;
      const showDateSeparator = currentDate !== previousDate;
      return (
        <View
          key={index}
          style={[
            isSelected && {
              backgroundColor: "#AFFF92",
              padding: 1,
              borderRadius: 10,
              opacity: 0.7,
            },
          ]}
        >
          {showDateSeparator ? (
            <Text style={styles.dateSeparator}> {currentDate} </Text>
          ) : null}
          <Pressable
            key={index}
            style={[
              item?.senderId?._id === userId
                ? styles.rightChatBox
                : styles.leftChatBox,
              highlightedMessageId === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
              highLight === item._id && {
                borderColor: "blue",
                borderWidth: 2,
              },
            ]}
            onLongPress={() => handleSelectedMessage(item)}
            onPress={() => {
              handlePress(source, item);
            }}
          >
            {item.imageViewOnce ? (
              renderMediaStatus({
                viewed: item.imageViewed,
                type: "image",
                timeStamp: item.timeStamp,
                senderId: item?.senderId?._id,
                userId: userId,
                starredBy: item?.starredBy,
                formatTime,
              })
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
                  alignItems="center"
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                  }}
                >
                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          item?.senderId?._id === userId ? "white" : "white",
                      },
                    ]}
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
      );
    },
    [seletedMessages, handlePress, handleSelectedMessage, mainURL]
  );

  const player = useVideoPlayer(selectedVideo, (player) => {
    player.loop = true;
    player.play();
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  //console.log(JSON.stringify(groupChatInfo, null, 2))
  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView
          style={styles.container}
          edges={["left", "right", "bottom"]}
        >
          <ImageBackground
            source={bckimage}
            resizeMode="cover"
            style={styles.image}
          >
            <Animated.View style={{ flex: animatedFlex }}>
              <FlatList
                data={getMessage}
                ref={flatListRef}
                key={refreshKey}
                inverted
                keyExtractor={(item) => item._id.toString()}
                initialNumToRender={10}
                maxToRenderPerBatch={15}
                getItemLayout={(item, index) => ({
                  length: 120,
                  offset: 120 * index,
                  index,
                })}
                renderItem={({ item, index }) => renderMessage(item, index)}
              />
            </Animated.View>
            {isSending && (
              <HStack space={2} justifyContent="flex-end" paddingRight={5}>
                <Spinner accessibilityLabel="Loading posts" />
                <Heading color="primary.500" fontSize="md">
                  Loading
                </Heading>
              </HStack>
            )}

            {selectedVideo && (
              <Modal
                visible={!!selectedVideo}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseVideo}
              >
                <View style={styles.modalContainer}>
                  {/* <Video
                  ref={(ref) => setVideoRef(ref)} 
                  source={{ uri: selectedVideo }}
                  style={styles.video}
                  resizeMode="contain"
                  useNativeControls 
                  shouldPlay 
                /> */}
                  <VideoView
                    style={styles.video}
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                  />
                  {!player.playing && (
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: [{ translateX: -25 }, { translateY: -25 }],
                      }}
                    >
                      <ActivityIndicator size="large" color="white" />
                    </View>
                  )}
                  <Entypo
                    name="cross"
                    size={24}
                    color="#666"
                    onPress={handleCloseVideo}
                    style={styles.closeButton}
                  />
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
                  <Image
                    ref={(ref) => setImageRef(ref)}
                    source={selectedImage}
                    style={styles.fullScreenImage}
                    onError={(error) => console.log("Image Load Error:", error)}
                  />
                </View>
              </Modal>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
              }}
            >
              <View style={{ flex: 1, justifyContent: "flex-end" }}>
                {replyMessage && <ReplyMessageView />}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 10,
                  }}
                >
                  {isRecording && (
                    <Box
                      style={styles.messageInputBox}
                      justifyContent={"center"}
                    >
                      <Text style={styles.swipeText}>
                        Swipe left to cancel...
                      </Text>
                    </Box>
                  )}
                  <>
                    {!isRecording && (
                      <TextInput
                        value={
                          selectedFile
                            ? "Please press send button" ||
                              (messageType === "image" ? "Image" : "Video")
                            : replyMessage || message
                        }
                        onChangeText={handleInputChange}
                        style={styles.messageInputBox}
                        multiline={true}
                        placeholder="Type Your message..."
                        editable={!selectedFile}
                      />
                    )}

                    {!selectedFile && (
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
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
                    )}

                    {selectedFile ? (
                      <>
                        <IconButton
                          icon={
                            <Icon
                              as={MaterialCommunityIcons}
                              name={
                                viewOnceSelected
                                  ? "numeric-1-circle"
                                  : "numeric-1-circle-outline"
                              }
                            />
                          }
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
                      <Animated.View
                        style={{
                          transform: [{ translateX }, { scale: scaleAnim }],
                          backgroundColor: isRecording ? "#4CAF50" : "#4CAF50",
                          borderRadius: 50,
                          padding: 1,
                        }}
                        {...panResponder.panHandlers}
                      >
                        <Ionicons
                          name="mic"
                          size={20}
                          color="white"
                          style={{ padding: 8 }}
                        />
                      </Animated.View>
                    )}
                  </>
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
            <MessageDeleteDialog
              isOpen={isDeleteMessagesOpen}
              onClose={() => setIsDeleteMessagesOpen(false)}
              header="Delete Messages"
              body={
                seletedMessages.every((message) => message.senderId === userId)
                  ? "Do you want to delete the messages just for yourself or for everyone?"
                  : "Do you want to delete the message?"
              }
              confirmText={
                seletedMessages.every((message) => message.senderId === userId)
                  ? "Delete for everyone"
                  : "Delete for me"
              }
              extraActionText={
                seletedMessages.every((message) => message.senderId === userId)
                  ? "Delete for me"
                  : ""
              }
              onConfirm={
                seletedMessages.every((message) => message.senderId === userId)
                  ? handleDeleteConfirm
                  : handleDeleteForMe
              }
              onExtraAction={
                seletedMessages.every((message) => message.senderId === userId)
                  ? handleDeleteForMe
                  : undefined
              }
            />
            <ConfirmationDialog
              isOpen={isDeleteChatOpen}
              onClose={() => setIsDeleteChatOpen(false)}
              onConfirm={handleClearChatConfirm}
              header="Clear this chat?"
              body="This action cannot be undone."
              confirmText="Clear chat"
              cancelText="Cancel"
            />
            <Actionsheet isOpen={isOpen} onClose={onClose} size="full">
              <Actionsheet.Content>
                {groupChatInfo ? (
                  <>
                    {/* If it's a Group */}
                    {groupChatInfo.groupMembers ? (
                      <>
                        <Box
                          p={4}
                          borderRadius="lg"
                          boxShadow="md"
                          bg="white"
                          width={"full"}
                        >
                          {/* Group Admin Section */}
                          <Text
                            fontSize="16"
                            fontWeight="bold"
                            mb={1}
                            color="teal.500"
                          >
                            Group Admin
                          </Text>

                          {groupChatInfo.groupAdmin ? (
                            <HStack spacing={4} mb={4} alignItems="center">
                              <Checkbox
                                value={groupChatInfo.groupAdmin._id}
                                isChecked={selectedAudience.includes(
                                  groupChatInfo.groupAdmin._id
                                )}
                                onChange={() =>
                                  toggleAudience(groupChatInfo.groupAdmin._id)
                                }
                              >
                                <Text fontWeight="medium">
                                  {groupChatInfo.groupAdmin.user_name}
                                </Text>
                              </Checkbox>
                            </HStack>
                          ) : (
                            <Text color="gray.500" mb={1}>
                              No Admin Assigned
                            </Text>
                          )}

                          <Divider my={4} />

                          {/* Members Section */}
                          <Text
                            fontSize="16"
                            fontWeight="bold"
                            color="teal.500"
                            pb={2}
                          >
                            Members
                          </Text>
                          <FlatList
                            data={groupChatInfo.groupMembers}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item: member }) => (
                              <HStack spacing={4} alignItems="center" mb={3}>
                                <Checkbox
                                  value={member._id}
                                  isChecked={selectedAudience.includes(
                                    member._id
                                  )}
                                  onChange={() => toggleAudience(member._id)}
                                >
                                  <Text fontWeight="medium">
                                    {member.user_name}
                                  </Text>
                                </Checkbox>
                              </HStack>
                            )}
                          />
                        </Box>
                      </>
                    ) : (
                      // If it's an Individual User
                      <Checkbox
                        value={groupChatInfo._id}
                        isChecked={selectedAudience.includes(groupChatInfo._id)}
                        onChange={() => toggleAudience(groupChatInfo._id)}
                      >
                        {groupChatInfo.user_name}
                      </Checkbox>
                    )}

                    <Button
                      bg={"green.700"}
                      onPress={() => groupVoiceCallHandle(userId, groupId)}
                      width={"full"}
                      rightIcon={<Icon as={Ionicons} name="call" size="sm" />}
                      size={"sm"}
                      borderRadius={50}
                      fontWeight={"bold"}
                    >
                      Voice Call
                    </Button>
                  </>
                ) : (
                  <Text>Loading...</Text>
                )}
              </Actionsheet.Content>
            </Actionsheet>

            <Actionsheet
              isOpen={isOpenVideoCall}
              onClose={onCloseVideoCall}
              size="full"
            >
              <Actionsheet.Content>
                {groupChatInfo ? (
                  <>
                    {/* If it's a Group */}
                    {groupChatInfo.groupMembers ? (
                      <>
                        <Box
                          p={4}
                          borderRadius="lg"
                          boxShadow="md"
                          bg="white"
                          width={"full"}
                        >
                          {/* Group Admin Section */}
                          <Text
                            fontSize="16"
                            fontWeight="bold"
                            mb={1}
                            color="teal.500"
                          >
                            Group Admin
                          </Text>

                          {groupChatInfo.groupAdmin ? (
                            <HStack spacing={4} mb={4} alignItems="center">
                              <Checkbox
                                value={groupChatInfo.groupAdmin._id}
                                isChecked={selectedAudience.includes(
                                  groupChatInfo.groupAdmin._id
                                )}
                                onChange={() =>
                                  toggleAudience(groupChatInfo.groupAdmin._id)
                                }
                              >
                                <Text fontWeight="medium">
                                  {groupChatInfo.groupAdmin.user_name}
                                </Text>
                              </Checkbox>
                            </HStack>
                          ) : (
                            <Text color="gray.500" mb={1}>
                              No Admin Assigned
                            </Text>
                          )}

                          <Divider my={4} />

                          {/* Members Section */}
                          <Text
                            fontSize="16"
                            fontWeight="bold"
                            color="teal.500"
                            pb={2}
                          >
                            Members
                          </Text>
                          <FlatList
                            data={groupChatInfo.groupMembers}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item: member }) => (
                              <HStack spacing={4} alignItems="center" mb={3}>
                                <Checkbox
                                  value={member._id}
                                  isChecked={selectedAudience.includes(
                                    member._id
                                  )}
                                  onChange={() => toggleAudience(member._id)}
                                >
                                  <Text fontWeight="medium">
                                    {member.user_name}
                                  </Text>
                                </Checkbox>
                              </HStack>
                            )}
                          />
                        </Box>
                      </>
                    ) : (
                      // If it's an Individual User
                      <Checkbox
                        value={groupChatInfo._id}
                        isChecked={selectedAudience.includes(groupChatInfo._id)}
                        onChange={() => toggleAudience(groupChatInfo._id)}
                      >
                        {groupChatInfo.user_name}
                      </Checkbox>
                    )}

                    <Button
                      bg={"green.700"}
                      onPress={() => groupVideoCallHandle(userId, groupId)}
                      width={"full"}
                      rightIcon={
                        <Icon as={Ionicons} name="videocam" size="sm" />
                      }
                      size={"sm"}
                      borderRadius={50}
                      fontWeight={"bold"}
                    >
                      Video Call
                    </Button>
                  </>
                ) : (
                  <Text>Loading...</Text>
                )}
              </Actionsheet.Content>
            </Actionsheet>
          </ImageBackground>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default MessageSrceen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: "center",
    resizeMode: "repeat",
  },
  text: {
    color: "white",
    fontSize: 42,
    lineHeight: 84,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#000000c0",
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
    textAlign: "right",
    fontWeight: "bold",
    color: "white",
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
    borderWidth: 2,
    color: "#fff",
    borderColor: "#fff",
    padding: 10,
    borderRadius: 100,
  },

  fullScreenImage: {
    width: "100%", // Full width of the screen
    height: "100%", // Full height of the screen
    resizeMode: "contain", // Maintain aspect ratio of the image
  },
  slider: {
    width: "90%",
    height: 40,
  },

  recordingDuration: {
    fontSize: 18,
    color: "#333",
  },
  micButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  micIcon: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50, // Make it round
    padding: 10,
  },
  animatedView: {
    width: 250,
    height: 150,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  videoView: { width: "90%", height: 200 },
  commonStyle: {
    backgroundColor: "#E0FFE8",
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#2E7800",
    padding: 5,
  },
  rightChatBox: {
    alignSelf: "flex-end",
    backgroundColor: "#d8fdd2",
    padding: 8,
    maxWidth: "60%",
    margin: 10,
    borderRadius: 7,
  },
  leftChatBox: {
    alignSelf: "flex-start",
    backgroundColor: "white",
    padding: 8,
    margin: 10,
    maxWidth: "60%",
    borderRadius: 7,
  },
  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#333",
    color: "white",
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 10,
  },
  messageInputBox: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "white",
    minHeight: 43,
    maxHeight: 120,
  },
  swipeText: {
    color: "grey",
  },
});
