import { Ionicons } from "@expo/vector-icons";
import { Icon, IconButton } from "native-base";
import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Animated, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const CustomButton = ({ iconName, onPress, rotation, bgColor }) => {
    const outerRingScale = useRef(new Animated.Value(1)).current;
    const innerRingScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const createPulseAnimation = (outerRing, innerRing) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(outerRing, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(outerRing, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(innerRing, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(innerRing, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        createPulseAnimation(outerRingScale, innerRingScale);
    }, []);

    return (
        <View style={styles.buttonWrapper}>
            <Animated.View
                style={[
                    styles.circleRing,
                    { transform: [{ scale: outerRingScale }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.circleBackground,
                    { transform: [{ scale: innerRingScale }] },
                ]}
            />
            <TouchableOpacity style={styles.button}>
                <IconButton onPress={() => onPress && onPress()} 
                    icon={
                        <Icon 
                            as={Ionicons} 
                            name={iconName} 
                            color={"white"}
                            style={rotation ? { transform: [{ rotate: `${rotation}deg` }] } : {}}
                        />
                    }
                    borderRadius="full"
                    background={bgColor} // Keep the background normal
                    _icon={{ size: "4xl" }}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonWrapper: {
        justifyContent: "center",
        alignItems: "center",
    },
    circleRing: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 5,
        borderColor: "#007bff",
        opacity: 0.1,
    },
    circleBackground: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        opacity: 0.4,
    },
});

export default CustomButton;
