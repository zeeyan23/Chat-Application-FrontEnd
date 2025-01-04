import { Box, Button, Checkbox, Divider, Fab, FormControl, Icon, Input, Popover, Pressable, ScrollView, Stack, Text, View } from "native-base";
import { useContext, useEffect, useRef, useState } from "react";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { FlatList, Image } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
function AddFriendsToGroup(){

    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();

    const [myfriends, setMyFriends]=useState([]);
    const [seletedFriends,setSelectedFriends]=useState([]);
    const [position, setPosition] = useState("left");
    const initialFocusRef = useRef(null);

    const [formData, setData] = useState({});

    const fetchUser = async () => {
        try {
            const response = await axios.get(
                `${mainURL}/get-all-friends/${userId}`
            );
            setMyFriends(response.data)
        } catch (error) {
            console.error('Error fetching friends:', error);
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
        fetchUser();
    },[])

    function onInputChange(enteredValue){
        setData({ ...formData, groupName: enteredValue });
    }
    const addToGroupMemeberList = async(item)=>{
        const isSelected = seletedFriends.includes(item._id);

        if(isSelected){
          setSelectedFriends((otherFriends)=> otherFriends.filter((id)=> id !== item._id))
        }else{
          setSelectedFriends((otherFriends)=> [...otherFriends, item._id])
        }
    }

    const createGroupHandle = async() =>{
        const groupData = {
            groupName: formData.groupName,
            groupMembers: Array.from(seletedFriends) // Using Set to match the example format with braces {}
        };
        try {
            const response = await axios.patch(`${mainURL}/creategroup/${userId}`, groupData);
            const { group: { _id: groupId, groupName: group_name } } = response.data;
            console.log(groupId)
            if (groupId) {
                // Redirect to the MessageScreen with groupId and flag
                navigation.replace('MessageScreen', {
                    recipentId: groupId, // For group chats, use groupId as recipientId
                    groupName: group_name,
                    isGroupChat: true,   // Pass a flag to indicate it's a group chat
                    groupId: groupId
                });
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
            if (error.response) {
                console.log('Server Error:', error.response.data);
            } else if (error.request) {
                console.log('Network Error:', error.request);
            } else {
                console.log('Other Error:', error.message);
            }
        }
    }
    return(
        <>
            <Box flex={1} background={"white"}>
                <Box padding={2}>
                    {seletedFriends.length > 0 && <Text fontSize="md" fontWeight={"semibold"} mb={3}>Selected Friends</Text>}
                    <FlatList
                        data={myfriends.friends?.filter((friend) => seletedFriends.includes(friend._id))}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Box
                                borderRadius="full"
                                mx={2}
                                p={2}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Image
                                    source={{
                                        uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
                                    }}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                                <Text>{item.user_name}</Text>
                            </Box>
                        )}
                    />
                    {seletedFriends.length > 0 && <Divider bg="gray.300" thickness="1" orientation="horizontal" />}
                </Box>
                <Box padding={2}>
                    <Text fontSize="md" fontWeight={"semibold"}>All Friends List</Text>
                    <FlatList 
                        data={myfriends.friends}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ paddingBottom: 10 }} 
                        style={{height: seletedFriends.length > 0 ? "80%" : "95%"}}
                        renderItem={({ item }) => (
                        
                            <Pressable onPress={()=>addToGroupMemeberList(item)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, padding: 10, borderRadius: 10,}}>
                                <Image
                                    source={{
                                        uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
                                    }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}/>
                                    {seletedFriends.includes(item._id) && <Checkbox colorScheme="green" position={"absolute"}  right={0} borderRadius={"full"} 
                                        isChecked={seletedFriends.includes(item._id)} onChange={() => addToGroupMemeberList(item)}></Checkbox>}
                                <Text>{item.user_name}</Text>
                            </Pressable>
                        
                        )}
                    />
                </Box>
            </Box>
            <Box bg={"white"} padding={3}> 
                <FormControl bottom={2}>
                    <FormControl.Label fontSize="md" fontWeight={"semibold"}>Group Name</FormControl.Label>
                    <Input width={"75%"} rounded="sm" fontSize="xs" ref={initialFocusRef} onChangeText={onInputChange}/>
                </FormControl>
                <Fab renderInPortal={false} shadow={5} size="sm" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                    size="4" name="checkmark" color="warmGray.50"  onPress={createGroupHandle} /> } />    
            </Box>
        </>
        
    )
}

export default AddFriendsToGroup;