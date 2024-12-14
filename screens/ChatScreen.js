import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import {  Text, View } from "react-native";
import { UserType } from "../Context/UserContext";
import { mainURL } from "../Utils/urls";
import { Avatar, Box, FlatList, HStack, Pressable, ScrollView, Spacer, VStack } from "native-base";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import UserChat from "./UserChat";

function ChatScreen(){

    const [friendsData, setFriendsData]=useState([]);
    const [messages, setMessages]=useState([]);
    const {userId, setUserId} = useContext(UserType);
    const navigation = useNavigation();
    useEffect(()=>{
        fetchFreinds();
    },[]);

    const fetchFreinds= async()=>{
        try {
            const response = await axios.get(
                `${mainURL}/get-all-friends/${userId}`).then((res)=>{
                    if(res.status ===200){
                        

                        setFriendsData(res.data);
                        
                    }
                }).catch((error)=>{
                    console.log('Error:', error); 
                    if (error.response) {
                        console.log('Server Error:', error.response.data); 
                    } else if (error.request) {
                        console.log('Network Error:', error.request); 
                    } else {
                        console.log('Other Error:', error.message); 
                    }
                })
        } catch (error) {
            
        }
    }

    return(
        
        <ScrollView>
            <Pressable>
                {friendsData.map((item, index)=>(
                    <UserChat key={index} item={item}/>
                ))}
            </Pressable>
        </ScrollView>
    )
}

export default ChatScreen;