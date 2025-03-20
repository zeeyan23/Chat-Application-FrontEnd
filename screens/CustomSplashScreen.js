import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync(); // Prevent Expo splash screen from auto-hiding

const CustomSplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start fully visible

  useEffect(() => {
    const hideSplash = async () => {
      // Simulate loading (e.g., API calls, async tasks)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Fade-out animation
      Animated.timing(fadeAnim, {
        toValue: 0, // Fade to opacity 0 (invisible)
        duration: 800, // 800ms fade duration
        useNativeDriver: true, // Optimize for performance
      }).start(async () => {
        await SplashScreen.hideAsync(); // Hide Expo splash screen
        onFinish(); // Navigate to the main app
      });
    };
    hideSplash();
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image source={require("../assets/icon.png")} style={styles.logo} />
      <Text style={styles.text}>Welcome to My App</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
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
    color: "white",
  },
});

export default CustomSplashScreen;
