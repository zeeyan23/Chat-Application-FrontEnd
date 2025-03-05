import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync(); // Prevent the splash from hiding immediately

const CustomSplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const hideSplash = async () => {
      // Simulate loading (e.g., API calls, async tasks)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await SplashScreen.hideAsync(); // Hide Expo splash screen
      onFinish(); // Navigate to the main app
    };
    hideSplash();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/icon.png")} style={styles.logo} />
      <Text style={styles.text}>Welcome to My App</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  text: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
});

export default CustomSplashScreen;
