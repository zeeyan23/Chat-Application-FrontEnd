import React, { useState, useEffect } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Box, HStack, Avatar, Text, Badge, Spacer, Divider, Flex } from 'native-base';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';
import { mainURL } from '../Utils/urls';

function UsersProfileScreen() {
  const [groupData, setGroupData] = useState(null); // Initialize as null instead of an array
  const route = useRoute();
  const navigation = useNavigation();

  const { groupId } = route.params || {};

  useEffect(() => {
    fetchGroupData();
  }, []);

  const fetchGroupData = async () => {
    try {
      const response = await axios.get(`${mainURL}/get-groupInfo/${groupId}`);
      setGroupData(response.data);
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

  // Avoid accessing properties of undefined
  const formattedData = groupData
    ? [
        { ...groupData.groupAdmin, role: 'Admin' }, // Admin with role
        ...(groupData.groupMembers || []), // Participants without role
      ]
    : [];

    console.log(JSON.stringify(formattedData, null, 2))
  return (
    <Box flex={1} padding={5}  background="white" safeArea width={"full"}>
      {/* Back Button */}
      <Box flexDirection="row" width={"full"}>
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color="black"
          onPress={() => navigation.goBack()}
        />
      </Box>

      {/* Group Info */}
      {groupData && (
        <>
            <Box flexDirection="column" width={"full"}alignItems={"center"} alignContent={"center"}>
                <Avatar
                    size="lg"
                    source={{
                    uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
                    }}
                />
                <Text fontSize="lg" fontWeight="semibold">
                    {groupData.groupName}
                </Text>
                <Flex direction="row" justifyContent="center" w="full" h="58" p="4">
                    <Text color="trueGray.700" fontSize="md">
                    Group
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.700" fontSize="md">
                    {groupData.groupMembers ? groupData.groupMembers.length : 0} Members
                    </Text>
                    <Divider bg="emerald.500" thickness="2" mx="2" orientation="vertical" />
                    <Text color="trueGray.700" fontSize="md">
                    {moment(groupData.created_date).format('DD/MM/YYYY')}
                    </Text>
                </Flex>
            </Box>
        </>
      )}
        <Text color="trueGray.700" fontSize="sm">
          {groupData?.groupMembers?.length || 0} members
        </Text>
        <FlatList
          data={formattedData}
          contentContainerStyle={{ }}
          renderItem={({ item }) => (
            <Box
              borderBottomWidth="1"
              _dark={{ borderColor: "muted.50" }}
              borderColor="muted.800"
              pl={["0", "4"]}
              pr={["0", "5"]}
              py="2"
            >
              <HStack space={[2, 3]} alignItems="center">
                <Avatar
                  size="md"
                  source={{
                    uri: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
                  }}
                />
                <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                  {item.user_name}
                </Text>
                <Spacer />
                {item.role === 'Admin' && <Badge colorScheme="success">Admin</Badge>}
              </HStack>
            </Box>
          )}
          keyExtractor={(item) => item._id}
        />
      
    </Box>
  );
}

export default UsersProfileScreen;
