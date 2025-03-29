import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Box,
  useDisclose,
  IconButton,
  Stagger,
  HStack,
  Icon,
  Center,
  NativeBaseProvider,
  Button,
  Pressable,
  Menu,
  HamburgerIcon,
  Input,
  Modal,
} from "native-base";
import {
  AntDesign,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useContext } from "react";
import { UserType } from "../Context/UserContext";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { mainURL } from "../Utils/urls";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { FlatList, Heading, Avatar, VStack, Spacer, Text } from "native-base";
import Entypo from "@expo/vector-icons/Entypo";
import socketInstance from "../Utils/socket";
import { AuthContext } from "../Context/AuthContext";
import ConfirmationDialog from "../components/ConfirmationDialog";
function HomeScreen() {
  const socket = socketInstance.getSocket();
  const { isOpen, onToggle } = useDisclose();
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();

  const [requestSent, setRequestSent] = useState([]);
  const [data, setData] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsReceived, setFriendRequestsReceived] = useState([]);
  const [userFriends, setUserFriends] = useState([]);

  const [enableSearchInputBox, setEnableSearchInputBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const { signOut } = useContext(AuthContext);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <Box paddingLeft={4}>
          <Text fontWeight={"bold"} fontSize={20} color={"white"}>
            Pending Requests
          </Text>
        </Box>
      ),
      headerRight: () => (
        <>
          <Pressable onPress={() => setShowModal(true)} style={{ paddingHorizontal:15}}>
              <Ionicons name="add-circle" size={24} color="white" />
          </Pressable>
            <Pressable style={{ paddingRight: 20 }} onPress={() => setIsLogoutDialogOpen(true)}>
              <AntDesign name="logout" size={18} color="white" />
          </Pressable>
          
        </>
      ),
    });
  }, []);
  const handleLogout = async () => {
    try {
      signOut();
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
  useEffect(() => {
    socket.emit("join", userId);
    socket.on("friendRequestReceived", (data) => {
      setFriendRequestsReceived((prev) => [
        ...prev,
        { _id: data.senderId, user_name: data.senderName },
      ]);
    });

    socket.on("friendRequestAccepted", (data) => {
      console.log("friendRequestAccepted", data);
      setUserFriends((prev) => [...prev, data.userId]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;
    setUserId(userId);
    const usersResponse = await axios.get(
      `${mainURL}/user/all_users/${userId}`
    );
    setData(usersResponse.data);

    const sentRequestsResponse = await axios.get(
      `${mainURL}/friend/friend-requests/sent/${userId}`
    );
    setFriendRequests(sentRequestsResponse.data);

    const sentRequestsReceivedResponse = await axios.get(
      `${mainURL}/friend/friend-requests/received/${userId}`
    );
    setFriendRequestsReceived(sentRequestsReceivedResponse.data);

    const friendsResponse = await axios.get(
      `${mainURL}/friend/friends/${userId}`
    );
    const flattenedFriends = friendsResponse.data.flat();
    setUserFriends(flattenedFriends);
  };

  useEffect(() => {
    

    fetchUser();
  }, []);

  const handleFriendRequest = async (recipent_id) => {
    try {
      setLoading(true);
      const data = { currentUserId: userId, selectedUserId: recipent_id };

      const response = await axios
        .post(`${mainURL}/friend/friend-request/`, data)
        .then((res) => {
          setRequestSent((prev) => [...prev, recipent_id]);
        });
        setShowModal(false);
        setTimeout(() => {
            fetchUser();
        }, 500);
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
    }finally {
      setLoading(false); // Stop loading after the request is completed
    }
  
  };

  // const deleteAllMessages = async () => {
  //     try {
  //       const response = await axios.delete( `${mainURL}/api/messages`);
  //       Alert.alert('Success', response.data.message);
  //     } catch (error) {
  //       Alert.alert('Error', 'Failed to delete messages.');
  //       console.error(error);
  //     }
  //   };

  const openChatFriend = async (item) => {
    const formData = {
      userId: userId,
      chatsTobeRemovedFromDeletedChat: item._id,
    };
    try {
      const response = await axios.delete(
        `${mainURL}/chat/remove_chat_from_deleted_chat/`,
        { data: formData }
      );

      if (response.status === 200) {
        navigation.navigate("MessageScreen", {
          userName: item.user_name,
          recipentId: item._id,
          userImage: item.image,
        });
      }
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      } else if (error.request) {
        console.log("Network Error:", error.request);
      } else {
        console.log("Other Error:", error.message);
      }
      navigation.navigate("MessageScreen", {
        userName: item.user_name,
        recipentId: item._id,
        userImage: item.image,
      });
    }
  };

  
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  function enableSearchInput(){
      if (isOpen) onToggle();
      setEnableSearchInputBox((prev) => !prev);
  }

  const submitSearch = () => {

      // Filter data based on exact match with user_name
      const result = data.filter(item => item.user_name.toLowerCase() === searchQuery.toLowerCase());
      setFilteredData(result);
  };

  return (
    <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
            >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Box style={styles.container}>
            
            <Box style={{ flex: 1, width: "100%" }}>
                <FlatList
                data={friendRequests}
                nestedScrollEnabled={true} 
                renderItem={({ item }) => {
                    const baseUrl = `${mainURL}/files/`;
                    const imageUrl = item.image;
                    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                    const filename = normalizedPath.split('/').pop();

                    const source = item.image 
                        ? { uri: baseUrl + filename } 
                        : null;
                    return(
                    <Box borderBottomWidth="0.3" borderColor="#999999" pl={["2", "4"]} pr={["2", "5"]} py="4">
                        <HStack space={[2, 3]} justifyContent="space-between">
                            {source ? <Avatar size="48px" source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                            <VStack alignSelf={"center"}>
                                <Text fontSize="lg" color="white" >{item.user_name}</Text>
                            </VStack>
                            <Spacer />
                            <Box alignSelf={"center"}>
                            {(requestSent.includes(item._id) || friendRequestsReceived.some((friend) => friend._id === item._id) || friendRequests.some((friend) => friend._id === item._id)) && (
                                <Pressable
                                style={{
                                    backgroundColor: "gray",
                                    padding: 10,
                                    width: 105,
                                    borderRadius: 6,
                                }}
                                >
                                <Text style={{ textAlign: "center", color: "white", fontSize: 10, fontWeight:"bold" }}>
                                {friendRequestsReceived.some((friend) => friend._id === item._id)
                                ? "Request Received"
                                : "Request Sent"}
                                </Text>
                                </Pressable>
                            )}
                            </Box>
                        </HStack>
                    </Box>)}} keyExtractor={(item) => item._id} 
                />
            </Box>

            <Box style={{ position: "absolute" }} alignSelf={"flex-end"} bottom={20} right={5} >
                <Stagger visible={isOpen} initial={{ opacity: 0, scale: 0, translateY: 34 }} 
                    animate={{ translateY: 0, scale: 1, opacity: 1, 
                    transition: { type: "spring", mass: 0.8, stagger: { offset: 30, reverse: true } } }} 
                    exit={{ translateY: 34, scale: 0.5, opacity: 0, transition: { duration: 100, 
                    stagger: { offset: 30, reverse: true } } }}>

                {/* <Pressable onPress={enableSearchInput} mb={4} bg="green.500" colorScheme={"green"} borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"add-circle"} />}size={6} color="warmGray.50" />
                </Pressable> */}

                <Pressable onPress={()=>navigation.navigate("FriendRequests")} mb={4} bg="indigo.500" colorScheme="indigo"  borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"people-circle-sharp"} />}size={6} color="warmGray.50" />
                </Pressable>

                <Pressable onPress={()=>navigation.navigate("Chats")} mb={4} bg="yellow.400" colorScheme="yellow"  borderRadius="full" p={3}>
                    <Icon as={<Ionicons name={"chatbox"} />}size={6} color="warmGray.50" />
                </Pressable>                    
                </Stagger>
            </Box>
            <HStack position={"absolute"} alignSelf={"flex-end"} bottom={10} right={5} >
                <IconButton variant="solid" borderRadius="full" size="lg" onPress={onToggle} bg="cyan.400" icon={<Icon as={MaterialCommunityIcons} size="6" name="dots-horizontal" color="warmGray.50" _dark={{ color: "warmGray.50" }} />} />
            </HStack>
            <Modal isOpen={showModal} onClose={() => {setShowModal(false); setSearchQuery(""); setFilteredData([])}}>
                <Modal.Content maxWidth="400px">
                    <Modal.CloseButton />
                    <Modal.Header>Add Connection</Modal.Header>
                    <Modal.Body>
                        <Box paddingBottom={5}>
                            <TextInput placeholder="Enter friend name" style={styles.inputBox} value={searchQuery} onChangeText={handleSearch}/>
                        </Box>
                        <FlatList
                            data={filteredData}
                            renderItem={({ item }) => {
                                const baseUrl = `${mainURL}/files/`;
                                const imageUrl = item.image;
                                const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                                const filename = normalizedPath.split('/').pop();

                                const source = item.image ? { uri: baseUrl + filename } : null;

                                return (
                                    <Box>
                                       <HStack alignItems="center" justifyContent="space-between">
  <HStack alignItems="center">
    {source ? (
      <Avatar size="48px" source={source}style={{ marginRight: 10 }} />
    ) : (
      <Ionicons name="person-circle-outline" style={{ marginRight: 10 }} size={48} color="gray" />
    )}
    <Text fontSize="lg" color="black" fontWeight="bold">
      {item.user_name}
    </Text>
  </HStack>

  <Spacer />

  {userFriends.includes(item._id) ? (
    <Pressable
      alignSelf={"center"}
      paddingVertical={2}
      paddingHorizontal={7}
      onPress={() => openChatFriend(item)}
      style={{
        backgroundColor: "#82CD47",
        borderRadius: 6,
      }}
    >
      <Text style={{ textAlign: "center", color: "white" }}>Friends</Text>
    </Pressable>
  ) : requestSent.includes(item._id) || 
    friendRequestsReceived.some((friend) => friend._id === item._id) || 
    friendRequests.some((friend) => friend._id === item._id) ? (
    <Pressable
      style={{
        backgroundColor: "gray",
        padding: 10,
        width: 105,
        borderRadius: 6,
      }}
    >
      <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
        {friendRequestsReceived.some((friend) => friend._id === item._id)
          ? "Request Received"
          : "Request Sent"}
      </Text>
    </Pressable>
  ) : (
    <>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <Pressable
        onPress={() => handleFriendRequest(item._id)}
        style={{
          backgroundColor: "#567189",
          //padding: 10,
          borderRadius: 6,
          //width: 105,
        }}
        alignSelf={"center"}
      paddingVertical={5}
      paddingHorizontal={15}
        disabled={loading}
      >
        <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
          Add Friend
        </Text>
      </Pressable>
    </>
  )}
</HStack>

                                    </Box>
                                );
                            }}
                            keyExtractor={(item) => item._id}
                            ListEmptyComponent={
                              <Text style={{ textAlign: "center", marginTop: 20, fontSize: 16, color: "gray" }}>
                                  No data found
                              </Text>
                          }
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onPress={submitSearch} padding={2}>
                            Search friend
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
            <ConfirmationDialog
              isOpen={isLogoutDialogOpen}
              onClose={() => setIsLogoutDialogOpen(false)}
              onConfirm={handleLogout}
              header="Logout?"
              body="Are you sure you want to log out?"
              confirmText="Logout"
              cancelText="Cancel"
            />
        </Box>
        
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    backgroundColor: "black",
  },
  inputBox: {
        color:"black",
        borderBottomWidth:1,
        borderBottomColor:"grey",
        padding:5
  },
});
export default HomeScreen;
