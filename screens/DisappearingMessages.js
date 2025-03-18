import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Box, Center, Container, Divider, Heading, HStack, Radio, Text, useToast, VStack } from "native-base";
import { useEffect, useState } from "react";
import { mainURL } from "../Utils/urls";
import { useRoute } from "@react-navigation/native";

function DisappearingMessages(){

    const [value, setValue] = useState("");
    const route = useRoute();
    const toast = useToast();
    const [disappearMessageTime, setDisAppearMessageTime]=useState("");

    const { participant_id, other_participant_id } = route.params

    const fetchChatSettings = async()=>{
        try {
          const response = await axios.get(`${mainURL}/chat/get_chat_settings/${userId}/${recipentId}`);
          setValue(response.data.messageDisappearTime);
          
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
      }
    
    useEffect(()=>{
        fetchChatSettings();
    },[])

    const handleSelection = async (nextValue) => {
        setValue(nextValue);
        const formData={
            "participant_id": participant_id,
            "other_participant_id": other_participant_id,
            "messageShouldDisappear": nextValue !== 'off',
            "messageDisappearTime": nextValue,

        }

        try {
            const response = await axios.patch(`${mainURL}/chat/update_chat_settings/`, formData, {
                headers: { "Content-Type": "application/json" },
            });
            toast.show({
                title: "Settings Saved",
                status: "success",
                duration: 3000, // 3 seconds
                placement: "bottom",
              });
        } catch (error) {
          console.error("Error updating message settings:", error);
          toast.show({
            title: "Error",
            description: "Failed to update message settings.",
            status: "error",
            duration: 3000,
            placement: "top",
          });
        }
      };
    return(
        <>
            <Box flex={1} background={"black"}>
                <VStack flex={1}>
                    <HStack justifyContent={"center"} paddingY={8}>
                        <Ionicons name="timer" size={100} color={"white"}/>
                    </HStack>
                    <Container paddingLeft={30} pb={8}>
                        <Heading color={"white"}>
                            Disappearing Messages
                        </Heading>
                        <Text mt="3" fontWeight="medium" color={"white"}>
                            For privacy, you can set messages in this chat to disappear after a selected time. This applies to new messages only.
                        </Text>
                    </Container>
                    <Divider opacity={0.3}/>
                    <Container paddingLeft={30} pt={8}>
                        <Heading color={"white"} fontSize={"md"}>Message Timer</Heading>
                        <Radio.Group name="myRadioGroup" accessibilityLabel="favorite number" value={value} onChange={handleSelection}>
                            <Radio value="24" my={5}>
                                <Text color={"white"}>24 hours</Text>
                            </Radio>
                            <Radio value="7">
                                <Text color={"white"}>7 days</Text>
                            </Radio>
                            <Radio value="90">
                                <Text color={"white"} my={5}>90 days</Text>
                            </Radio>
                            <Radio value="off">
                                <Text color={"white"}>Off</Text>
                            </Radio>
                        </Radio.Group>
                    </Container>
                </VStack>
                
            </Box>
        </>
    )
}

export default DisappearingMessages;