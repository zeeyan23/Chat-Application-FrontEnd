import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { mainURL } from '../Utils/urls';
import { navigationRef } from '../App';
import { CommonActions } from '@react-navigation/native';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
          const response = await axios.get(`${mainURL}/user/get-user-id-from-token`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userId = response.data.userId;
          const friendResponse = await axios.get(`${mainURL}/friend/has-friends/${userId}`);
          setIsNewUser(!friendResponse.data.exists);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, []);

  const signIn = () => setIsAuthenticated(true);
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setIsAuthenticated(false);
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isNewUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};