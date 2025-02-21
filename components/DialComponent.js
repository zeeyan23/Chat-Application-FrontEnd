import { Avatar, Box, Center, Icon, IconButton, Text } from "native-base";
import { mainURL } from "../Utils/urls";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

function DialComponent({userName, userImage, callStatus, callDuration, onLeaveCall}){

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
                        <Ionicons name="person-circle-outline" size={100} color="gray" /> // ✅ Should now render correctly
                    )}
                    {/* {source!=null ? ( <Avatar size="2xl" source={source} /> ) : ( <Ionicons name="person-circle-outline" size={100} color="gray" />)} */}
                </Box>
                <Text>{userName}</Text>
                {callStatus === "Call Connected" ? <Text color={"black"}>Duration: {callDuration}</Text> : callStatus === "Waiting..." ? 
                    <Text>Waiting for call to connect</Text> : callStatus === "Call Declined" ? 
                    <Text>{userName} has declined call</Text> : callStatus === "User Left" ? 
                    <Text>{userName}  has left the call</Text> : ""}
            </Box>
            <Box flex={1} justifyContent="flex-end" alignItems="center">
                <IconButton
                    icon={
                        <Icon 
                            as={Ionicons} 
                            name="call-outline" 
                            color={"white"} 
                            style={{ transform: [{ rotate: '136deg' }] }} // Rotate only the icon
                        />
                    }
                    borderRadius="full"
                    background="red.900" // Keep the background normal
                    _icon={{ size: "4xl" }}
                    onPress={onLeaveCall}
                />
            </Box>
        </Box>
    )
}

export default DialComponent;

const styles= StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }
});