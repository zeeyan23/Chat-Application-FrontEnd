import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { useContext } from "react";
import { UserType } from "../Context/UserContext";
import { Avatar, Button, Fab, Icon, IconButton } from "native-base";
import Ionicons from '@expo/vector-icons/Ionicons';

function ForwardMessagesScreen({ route, navigation }){

    const { seletedMessages } = route.params;
    const [friends, setFriends] = useState([]); 
    const [selectedFriends, setSelectedFriends] = useState([]); 
    const {userId, setUserId} = useContext(UserType);
    useEffect(() => {
        const fetchFriends = async () => {
        try {
            const response = await axios.get(`${mainURL}/get-all-friends/${userId}`);
            setFriends(response.data.friends); 
            console.log(response.data)
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
        };
        fetchFriends();
    }, []);

    const toggleFriendSelection = (friendId) => {
        setSelectedFriends((prevSelected) =>
          prevSelected.includes(friendId)
            ? prevSelected.filter((id) => id !== friendId)
            : [...prevSelected, friendId]
        );
      };
      
      const handleForwardMessage = async () => {
        console.log(userId, selectedFriends, seletedMessages)
        try {
          await Promise.all(
            selectedFriends.map(async (friendId) => {
                const response = await axios.post(
                    `${mainURL}/messages/forward`, 
                    {
                      senderId : userId,
                      recipientId: friendId,
                      messageIds: seletedMessages,
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    }
                  );
            })
          );
          navigation.navigate('Chats');
        } catch (error) {
          console.error('Error forwarding messages:', error);
        }
      };

      const friendsData = friends[0]?.friendsList || [];
    return(
        <View style={{ flex: 1, padding: 10, backgroundColor:"black" }}>
            <FlatList
                data={friendsData}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const baseUrl = `${mainURL}/files/`;
                  const imageUrl = item.image;
                  const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                  const filename = normalizedPath.split('/').pop();

                  const source = item.image 
                      ? { uri: baseUrl + filename } 
                      : null;
                  return (
                    <Pressable
                        onPress={() => toggleFriendSelection(item._id)}
                        style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: 5,
                        backgroundColor: selectedFriends.includes(item._id) ? 'white' : '#D1D1D1',
                        padding: 10,
                        borderRadius: 10,
                        }}
                    >
                        {source ? <Avatar size="48px"marginRight={2} source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                        <Text>{item.user_name}</Text>
                    </Pressable>)}}/>
                    <View
                        style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTopWidth: 1,
                        padding: 10,
                        }}>
                        <FlatList
                        horizontal
                        data={friends.filter((f) => selectedFriends.includes(f._id))}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <Text style={{ marginHorizontal: 5 }}>{item.user_name}</Text>
                        )}
                        />
                        <IconButton icon={<Icon as={Ionicons} name="arrow-redo" color={"white"}/>} backgroundColor={"#21AB00"} onPress={handleForwardMessage} disabled={selectedFriends.length === 0} />
                    </View>
        </View>
    );
}

export default ForwardMessagesScreen;