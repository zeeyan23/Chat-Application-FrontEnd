import { Avatar, Box, Center, Icon, IconButton, Text } from "native-base";
import { mainURL } from "../Utils/urls";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import CustomButton from "./CustomButton";

function ReceiverComponent({userName, userImage, declineCall, acceptCall, callStatus, callDuration}){
    const baseUrl = `${mainURL}/files/`;
    const imageUrl = userImage;
    const normalizedPath = imageUrl ? imageUrl.replace(/\\/g, '/') : '';
    const filename = normalizedPath.split('/').pop();
    
    const source = userImage ? { uri: baseUrl + filename } : null;
    

    return(
        <Box flex={1} flexDirection="column" width={"full"} padding={5} background={"white"}>
            <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                <Box maxW="96" rounded="full">
                    {source && source.uri ? ( // ✅ Ensure source.uri exists
                        <Avatar size="2xl" source={source} />
                    ) : (
                        <Ionicons name="person-circle-outline" size={100} color="gray" />
                    )}
                </Box>
                <Text>{userName}</Text>
                {callStatus === "Call Connected" ? <Text color={"black"}>Duration: {callDuration}</Text> : callStatus === "Waiting..." ? 
                    <Text>Incoming Call...</Text> : callStatus === "Call Declined" ? 
                    <Text>You has declined call</Text> : callStatus === "User Left" ? 
                    <Text>{userName}  has left the call</Text> : ""}
            </Box>
            <Box flex={1} justifyContent="flex-end" padding={10}>
                <Box flexDirection={"row"} justifyContent={callStatus !== "Call Connected" ? "space-between" : "center"}>
                    {callStatus!="Call Connected" && <CustomButton iconName={"call-outline"} bgColor="green.700" onPress={acceptCall}/>}
                    <CustomButton iconName={"call-outline"} rotation={135} bgColor={"red.900"} onPress={declineCall}/>
                </Box>
            </Box>
        </Box>
    )
}

export default ReceiverComponent;

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      },
});