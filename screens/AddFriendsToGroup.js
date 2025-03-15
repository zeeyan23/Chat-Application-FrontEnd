import { Avatar, Box, Button, Checkbox, Divider, Fab, FormControl, Icon, Input, Popover, Pressable, ScrollView, Stack, Text, View } from "native-base";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import axios from "axios";
import { FlatList, Image } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from "@react-navigation/native";
function AddFriendsToGroup(){

    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();
    const initialFocusRef = useRef(null);

    const [existingMembers, setExistingMembers]=useState([]);
    const [myfriends, setMyFriends]=useState([]);
    const [seletedFriends,setSelectedFriends]=useState([]);
    const [formData, setData] = useState({});
    const [error, setError] = useState(false);

    const route = useRoute();
    const isMemberAdd = route.params?.isMemberAdd || false;
    const groupId = route.params?.groupId || null;

    // console.log(isMemberAdd)

    useLayoutEffect(()=>{
        navigation.setOptions({
            headerTitle: () => <Text fontSize={"md"} fontWeight={"bold"} color={"white"}> Add Friends to Group</Text>,
        })
    },[])

    const handleMemberAdd = async() => {
        try {
            const response = await axios.get(`${mainURL}/friend/get_chat_info/${groupId}`);
            setExistingMembers(response.data)
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
    };

    useEffect(()=>{
        if (isMemberAdd) {
            handleMemberAdd();
        }
    },[groupId])
    

    const fetchUser = async () => {
        try {
            const response = await axios.get(
                `${mainURL}/friend/get-all-friends/${userId}`
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
        setError(false);
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
        if (!formData.groupName || formData.groupName.length < 3) {
            setError(true);
            return;
        }
        
        const groupData = {
            groupName: formData.groupName,
            groupMembers: Array.from(seletedFriends) 
        };
        try {
            const response = await axios.patch(`${mainURL}/group/creategroup/${userId}`, groupData);
            const { group: { _id: groupId, groupName: group_name } } = response.data;
            
            if (groupId) {
                
                navigation.replace('MessageScreen', {
                    recipentId: groupId, 
                    groupName: group_name,
                    isGroupChat: true,   
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

    const addMemberToGroupHandle = async()=>{
        const groupData ={
            groupMembers: Array.from(seletedFriends) 
        }

        try {
            const response = await axios.patch(`${mainURL}/group/update_group_member/${groupId}`, groupData);
            navigation.navigate("Chats")
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
    function renderAllFriends(){
        return(
            <FlatList 
                data={myfriends?.friends?.flatMap(friend => friend.friendsList)}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 10 }} 
                style={{height: seletedFriends.length > 0 ? "80%" : "95%"}}
                renderItem={({ item }) => {
                
                    const baseUrl = `${mainURL}/files/`;
                    const imageUrl = item?.image;
                    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                    const filename = normalizedPath.split('/').pop();

                    const source = item?.image 
                        ? { uri: baseUrl + filename } 
                        : null;
                    return(
                        <Pressable onPress={()=>addToGroupMemeberList(item)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, padding: 10, borderRadius: 10,}}>
                            {source ? <Image style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}  source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                            {seletedFriends.includes(item._id) && <Checkbox colorScheme="green" position={"absolute"}  right={0} borderRadius={"full"} 
                                isChecked={seletedFriends.includes(item._id)} onChange={() => addToGroupMemeberList(item)}></Checkbox>}
                            <Text color={"white"}>{item.user_name}</Text>
                        </Pressable>
                    )
                
                }}
                ListEmptyComponent={
                    <Box alignItems="center" justifyContent="center" mt="10">
                        <Text fontSize="lg" color="gray.500">
                            No friends to create group
                        </Text>
                    </Box>
                }
            />
        )
    }

    function renderFilteredNonGroupMember(){

        console.log('existingMembers:', existingMembers);
        console.log('myfriends:', myfriends);

        const groupMemberIds = new Set([
            ...(Array.isArray(existingMembers?.groupMembers) ? existingMembers.groupMembers.map(member => member?._id) : []),
            existingMembers?.groupAdmin?._id
        ].filter(Boolean)); // Removes undefined values
    
        // Ensure `myfriends` structure is valid
        const filteredFriendsList = Array.isArray(myfriends?.friends) && myfriends.friends.length > 0
            ? myfriends.friends[0]?.friendsList?.filter(friend => friend && !groupMemberIds.has(friend._id)) || []
            : [];

        return(
            <FlatList 
                data={filteredFriendsList}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 10 }} 
                style={{height: seletedFriends.length > 0 ? "80%" : "95%"}}
                renderItem={({ item }) => {
                    if (!item) return null;
                    const baseUrl = `${mainURL}/files/`;
                    const imageUrl = item?.image;
                    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                    const filename = normalizedPath.split('/').pop();

                    const source = item?.image 
                        ? { uri: baseUrl + filename } 
                        : null;
                    return(
                        <Pressable onPress={()=>addToGroupMemeberList(item)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, padding: 10, borderRadius: 10,}}>
                            {source ? <Image style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}  source={source}/> : 
                                <Ionicons name="person-circle-outline" size={48} color="gray" />}
                            {seletedFriends.includes(item._id) && <Checkbox colorScheme="green" position={"absolute"}  right={0} borderRadius={"full"} 
                                isChecked={seletedFriends.includes(item._id)} onChange={() => addToGroupMemeberList(item)}></Checkbox>}
                            <Text color={"white"}>{item.user_name}</Text>
                        </Pressable>
                    )
                
                }}
                ListEmptyComponent={
                    <Box alignItems="center" justifyContent="center" mt="10">
                        <Text fontSize="lg" color="gray.500">
                            No friends to create group
                        </Text>
                    </Box>
                }
            />
        )
    }
    return(
        <>
            <Box flex={1} background={"black"}>
                <Box padding={2}>
                    {seletedFriends.length > 0 && <Text fontSize="md" fontWeight={"semibold"} mb={3} color={"white"}>Selected Friends</Text>}
                    <FlatList
                        data={myfriends.friends?.flatMap((friend) => friend.friendsList).filter((friend) => seletedFriends.includes(friend._id))}
                        keyExtractor={(item) => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const baseUrl = `${mainURL}/files/`;
                            const imageUrl = item.image;
                            const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
                            const filename = normalizedPath.split('/').pop();

                            const source = item.image 
                                ? { uri: baseUrl + filename } 
                                : null;
                            return (
                            <Box
                                borderRadius="full"
                                mx={2}
                                p={2}
                                alignItems="center"
                                justifyContent="center"
                            >
                                {source ? <Avatar size="48px" source={source}/> : <Ionicons name="person-circle-outline" size={48} color="gray" />}
                                <Text color={"white"}>{item.user_name}</Text>
                            </Box>
                            )}}/>
                    {seletedFriends.length > 0 && <Divider bg="gray.300" thickness="1" orientation="horizontal" />}
                </Box>
                <Box padding={2}>
                    <Text fontSize="md" fontWeight={"semibold"} color={"white"}>All Friends List</Text>
                    {isMemberAdd ? renderFilteredNonGroupMember() : renderAllFriends()}
                    
                </Box>
            </Box>
            <Box bg={"black"} padding={3}> 
                {!isMemberAdd && <FormControl bottom={2} isInvalid={error}>
                    <FormControl.Label fontSize="md" fontWeight={"semibold"}>{error ? "Please enter group name" : "Group Name"}</FormControl.Label>
                    <Input width={"75%"} rounded="sm" fontSize="xs" ref={initialFocusRef} onChangeText={onInputChange} color={"white"}/>
                </FormControl>}
                <Fab renderInPortal={false} shadow={5} size="sm" icon={<Icon as={Ionicons} _dark={{ color: "warmGray.50" }} 
                    size="4" name="checkmark" color="warmGray.50"   /> }  onPress={() => { 
                        isMemberAdd ? addMemberToGroupHandle() : createGroupHandle(); 
                      }} />    
            </Box>
        </>
        
    )
}

export default AddFriendsToGroup;