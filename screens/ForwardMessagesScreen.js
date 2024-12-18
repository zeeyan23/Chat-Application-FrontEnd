import { useEffect, useState } from "react";
import { Button, FlatList, Image, Pressable, Text, View } from "react-native";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { useContext } from "react";
import { UserType } from "../Context/UserContext";

function ForwardMessagesScreen({ route, navigation }){

    const { seletedMessages } = route.params;
    const [friends, setFriends] = useState([]); // List of friends
    const [selectedFriends, setSelectedFriends] = useState([]); // Friends selected for forwarding
    const {userId, setUserId} = useContext(UserType);

    // Fetch sender's friends
    useEffect(() => {
        const fetchFriends = async () => {
        try {
            const response = await axios.get(`${mainURL}/get-all-friends/${userId}`);
            setFriends(response.data); // Replace with appropriate API
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
    

      // Send Forwarded Message
      
      const handleForwardMessage = async () => {
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

      
    return(
        <View style={{ flex: 1, padding: 10 }}>
            {/* Friend List */}
            <FlatList
                data={friends}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                <Pressable
                    onPress={() => toggleFriendSelection(item._id)}
                    style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 5,
                    backgroundColor: selectedFriends.includes(item._id) ? '#d3f3fd' : '#fff',
                    padding: 10,
                    borderRadius: 10,
                    }}
                >
                    <Image
                    source={{
                        uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
                      }}
                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                    />
                    <Text>{item.user_name}</Text>
                </Pressable>
                )}
            />

            {/* Bottom Bar */}
            <View
                style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                padding: 10,
                }}
            >
                {/* Selected Friends */}
                <FlatList
                horizontal
                data={friends.filter((f) => selectedFriends.includes(f._id))}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <Text style={{ marginHorizontal: 5 }}>{item.user_name}</Text>
                )}
                />

                {/* Send Button */}
                <Button
                title="Send"
                onPress={handleForwardMessage}
                disabled={selectedFriends.length === 0}
                />
            </View>
        </View>
    );
}

export default ForwardMessagesScreen;