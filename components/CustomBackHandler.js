import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const useBackHandler = (excludeScreen = 'Chats') => {
  const navigation = useNavigation();
  
  useEffect(() => {
    const handleBackPress = () => {
      const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;

      if (currentRoute !== excludeScreen) {
        // If the current screen is not HomeScreen, go back
        navigation.goBack();
      } else {
        // If it's HomeScreen, exit the app
        BackHandler.exitApp();
      }

      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove(); // Cleanup on unmount
    };
  }, [navigation, excludeScreen]);
};

export default useBackHandler;
