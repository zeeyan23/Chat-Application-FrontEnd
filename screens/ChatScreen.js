import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useContext } from "react";
import { useState } from "react";
import { BackHandler, SafeAreaView, StyleSheet, View } from "react-native";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import {
  Avatar,
  Box,
  FlatList,
  HStack,
  Pressable,
  ScrollView,
  Spacer,
  VStack,
  Text,
  Stagger,
  useDisclose,
  IconButton,
  Icon,
  Menu,
  Spinner,
} from "native-base";
import axios from "axios";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import UserChat from "./UserChat";
import io from "socket.io-client";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import socketInstance from "../Utils/socket";
function ChatScreen() {
  const [friendsData, setFriendsData] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [friendsWithLastMessage, setFriendsWithLastMessage] = useState([]);

  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  const socket = socketInstance.getSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const onToggle = () => setIsOpen((prev) => !prev);

  // useEffect(() => {
  //   const backAction = () => {
  //     BackHandler.exitApp();
  //   };

  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction
  //   );

  //   return () => backHandler.remove();
  // }, []);

  // const clearAsyncStorage = async () => {
  //   try {
  //     await AsyncStorage.clear();
  //     console.log('AsyncStorage cleared successfully!');
  //   } catch (error) {
  //     console.error('Error clearing AsyncStorage:', error);
  //   }
  // };

  // clearAsyncStorage();

  useFocusEffect(
    useCallback(() => {
      setIsOpen(false);
      fetchUser();

      return () => {};
    }, [])
  );
  const fetchUser = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem("authToken");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;
    setUserId(userId);

    try {
      const response = await axios.get(
        `${mainURL}/friend/get-all-friends/${userId}`
      );
      if (response.status === 200) {
        setFriendsData(response.data);

        const friendsData = response.data.friends || [];
        const pinnedChats = response.data.pinnedChats || [];
        const groupsData = response.data.groups || [];
        const groupMembershipsData = response.data.groupMembers || [];
        if (Array.isArray(friendsData)) {
          const updatedFriends = await Promise.all(
            friendsData.map(async (friend) => {
              const updatedFriendList = await Promise.all(
                friend.friendsList.map(async (item) => {
                  const lastMessage = await fetchLastMessageForFriend(
                    userId,
                    item._id,
                    "friend"
                  );
                  //const isPinned = pinnedChats.some(chat => chat._id === item._id);
                  const isPinned = pinnedChats.some((pinnedId) => {
                    // Handle primitive ID comparison
                    if (!pinnedId || !item._id) {
                      console.log(
                        "Skipping comparison due to undefined _id:",
                        pinnedId,
                        item
                      );
                      return false;
                    }
                    // Compare directly with group._id
                    // console.log('Comparing:', pinnedId.toString(), 'with', item._id.toString());
                    return pinnedId.toString() === item._id.toString();
                  });

                  return { ...item, lastMessage, isPinned, type: "friend" };
                })
              );
              return { ...friend, friendsList: updatedFriendList };
            })
          );

          const updatedGroups = await Promise.all(
            groupsData.map(async (group) => {
              const lastMessage = await fetchLastMessageForFriend(
                null,
                group._id,
                "group"
              );
              const isPinned = pinnedChats.some((pinnedId) => {
                // Handle primitive ID comparison
                if (!pinnedId || !group._id) {
                  console.log(
                    "Skipping comparison due to undefined _id:",
                    pinnedId,
                    group
                  );
                  return false;
                }
                // Compare directly with group._id
                //console.log('Comparing:', pinnedId.toString(), 'with', group._id.toString());
                return pinnedId.toString() === group._id.toString();
              });

              return { ...group, lastMessage, isPinned, type: "group" };
            })
          );

          const combinedData = [
            ...updatedGroups,
            ...updatedFriends.flatMap((f) =>
              f.friendsList.filter(
                (friend) => !f.deletedChats?.includes(friend._id)
              )
            ),
            ...groupMembershipsData,
          ];

          combinedData.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const timestampA = a.lastMessage?.timeStamp
              ? moment(a.lastMessage.timeStamp)
              : moment(0);
            const timestampB = b.lastMessage?.timeStamp
              ? moment(b.lastMessage.timeStamp)
              : moment(0);

            // const timestampA = moment(a.lastMessage?.timeStamp);
            // const timestampB = moment(b.lastMessage?.timeStamp);
            return timestampB.isBefore(timestampA) ? -1 : 1;
          });
          setFriendsWithLastMessage(combinedData);
        } else {
          console.log(
            "Error: Expected friends to be an array but received:",
            friendsData
          );
        }
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchLastMessageForFriend = async (
    userId,
    targetId,
    type = "friend"
  ) => {
    //console.log(userId,targetId)
    try {
      const endpoint =
        type === "group"
          ? `${mainURL}/message/get-group-messages/${targetId}`
          : `${mainURL}/message/get-messages/${userId}/${targetId}`;

      const response = await axios.get(endpoint);
      const messages = response.data.message.filter(
        (message) => !message.clearedBy.includes(userId)
      );
      const lastMessage = messages[messages.length - 1] || null;
      return lastMessage;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      //console.error(`Error fetching messages for friend ID ${friendId}:`, error);
      return null;
    }
  };

  const handleNewMessage = (data) => {
    setFriendsWithLastMessage((prevFriends) => {
      const friendIndex = prevFriends.findIndex(
        (friend) =>
          friend._id === data.senderId || friend._id === data.receiverId
      );

      if (friendIndex === -1) {
        return prevFriends;
      }
      const updatedFriends = [...prevFriends];
      const friendToUpdate = updatedFriends[friendIndex];
      updatedFriends[friendIndex] = {
        ...friendToUpdate,
        lastMessage: {
          ...friendToUpdate.lastMessage,
          message: data.message,
          timeStamp: data.timestamp,
        },
      };
      const reorderedFriends = [
        updatedFriends[friendIndex],
        ...updatedFriends.filter((_, index) => index !== friendIndex),
      ];

      return reorderedFriends;
    });
    fetchUser();
  };

  useEffect(() => {
    socket.on("pinnedChatsUpdated", (updatedPinnedChats) => {
      setFriendsData((prevData) => ({
        ...prevData,
        friends: prevData.friends.map((friend) => ({
          ...friend,
          isPinned: updatedPinnedChats.includes(friend._id),
        })),
      }));
    });

    socket.on("update_chat", (data) => {
      console.log("update_chat", data);
      handleNewMessage(data);
    });
    // return () => {
    //   socket.disconnect();
    // };
  }, [socket]);

  return (
    <Box flex={1} backgroundColor={"black"}>
      {friendsWithLastMessage?.length > 0 ? (
        <ScrollView>
          <Pressable>
            {friendsWithLastMessage?.map((item, index) => (
              <UserChat
                key={index}
                item={item}
                selectedChats={selectedChats}
                setSelectedChats={setSelectedChats}
                onPinUpdate={fetchUser}
                onChatUpdate={fetchUser}
              />
            ))}
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.container}>
          <Spinner color="white" size="lg" />
        </View>
      )}
      <Box
        style={{ position: "absolute" }}
        alignSelf={"flex-end"}
        bottom={20}
        right={5}
      >
        <Stagger
          visible={isOpen}
          initial={{ opacity: 0, scale: 0, translateY: 34 }}
          animate={{
            translateY: 0,
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring",
              mass: 0.8,
              stagger: { offset: 30, reverse: true },
            },
          }}
          exit={{
            translateY: 34,
            scale: 0.5,
            opacity: 0,
            transition: {
              duration: 100,
              stagger: { offset: 30, reverse: true },
            },
          }}
        >
          <IconButton
            mb="4"
            variant="solid"
            bg="blue.500"
            colorScheme="indigo"
            borderRadius="md"
            icon={
              <Icon
                as={Ionicons}
                size="6"
                name="people-sharp"
                _dark={{ color: "warmGray.50" }}
                color="warmGray.50"
              />
            }
            onPress={() => navigation.navigate("FriendRequests")}
          />

          <IconButton
            mb="4"
            variant="solid"
            bg="violet.600"
            colorScheme="yellow"
            borderRadius="md"
            icon={
              <Icon
                as={MaterialCommunityIcons}
                _dark={{ color: "warmGray.50" }}
                size="6"
                name="account-group"
                color="warmGray.50"
              />
            }
            onPress={() => navigation.navigate("AddFriendsToGroup")}
          />

          <IconButton
            mb="4"
            variant="solid"
            bg="amber.500"
            colorScheme="yellow"
            borderRadius="md"
            icon={
              <Icon
                as={Ionicons}
                _dark={{ color: "warmGray.50" }}
                size="6"
                name="person-add"
                color="warmGray.50"
              />
            }
            onPress={() => navigation.navigate("Home")}
          />
        </Stagger>
      </Box>
      <HStack
        position={"absolute"}
        alignSelf={"flex-end"}
        bottom={10}
        right={5}
      >
        <IconButton
          variant="solid"
          borderRadius="md"
          size="lg"
          onPress={onToggle}
          bg="green.700"
          icon={
            <Icon
              as={MaterialCommunityIcons}
              size="6"
              name="chat-plus"
              color="warmGray.50"
              _dark={{ color: "warmGray.50" }}
            />
          }
        />
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatScreen;
