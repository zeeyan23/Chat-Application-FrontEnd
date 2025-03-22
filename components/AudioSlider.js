/**
 * MessageScreen.js
 *
 * This file contains a custom audio player component.
 * The audio slider functionality has been implemented based on code from:
 *
 * Copyright (c) 2021 Vincent Lohse
 *
 * Based on code from https://github.com/olapiv/expo-audio-player/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { PureComponent } from "react";
import {
  TouchableOpacity,
  Animated,
  PanResponder,
  View,
  Easing,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import sleep from "./sleep";

const TRACK_SIZE = 4;
const THUMB_SIZE = 20;

export default class AudioSlider extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      currentTime: 0, // milliseconds; value interpolated by animation
      duration: 0,
      trackLayout: {},
      dotOffset: new Animated.ValueXY(),
      xDotOffsetAtAnimationStart: 0,
      pausedPosition: 0, // Store the paused position
    };

    // PanResponder setup (no change here)
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: async (e, gestureState) => {
        if (this.state.playing) {
          await this.pause();
        }
        await this.setState({
          xDotOffsetAtAnimationStart: this.state.dotOffset.x._value,
        });
        await this.state.dotOffset.setOffset({
          x: this.state.dotOffset.x._value,
        });
        await this.state.dotOffset.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        Animated.event([
          null,
          { dx: this.state.dotOffset.x, dy: this.state.dotOffset.y },
        ])(e, gestureState);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: async (evt, gestureState) => {
        const currentOffsetX =
          this.state.xDotOffsetAtAnimationStart + this.state.dotOffset.x._value;
        if (
          currentOffsetX < 0 ||
          currentOffsetX > this.state.trackLayout.width
        ) {
          await this.state.dotOffset.setValue({
            x: -this.state.xDotOffsetAtAnimationStart,
            y: 0,
          });
        }
        await this.state.dotOffset.flattenOffset();
        await this.mapAudioToCurrentTime();
      },
      onPanResponderRelease: async (e, { vx }) => {
        const currentOffsetX =
          this.state.xDotOffsetAtAnimationStart + this.state.dotOffset.x._value;
        if (
          currentOffsetX < 0 ||
          currentOffsetX > this.state.trackLayout.width
        ) {
          await this.state.dotOffset.setValue({
            x: -this.state.xDotOffsetAtAnimationStart,
            y: 0,
          });
        }
        await this.state.dotOffset.flattenOffset();
        await this.mapAudioToCurrentTime();
      },
    });
  }

  mapAudioToCurrentTime = async () => {
    await this.soundObject.setPositionAsync(this.state.currentTime);
  };

  onPressPlayPause = async () => {
    if (!this.soundObject._loaded) {
      await this.soundObject
        .loadAsync({ uri: this.props.audio.uri })
        .then((res) => console.log("sound is loaded", res))
        .catch((e) => console.log("error while loading :", e));
    }
    if (this.state.playing) {
      await this.pause();
      return;
    }
    await this.play();
  };

  play = async () => {
    if (this.state.pausedPosition > 0) {
      // If there is a saved position, start from there
      await this.soundObject.setPositionAsync(this.state.pausedPosition);
    }

    await this.soundObject.playAsync();
    this.setState({ playing: true, pausedPosition: 0 }); // This is for the play-button to go to play
    this.startMovingDot();
  };

  pause = async () => {
    const status = await this.soundObject.getStatusAsync();
    // Save the current position when paused
    const currentPosition = status.positionMillis;
    this.setState({ playing: false, pausedPosition: currentPosition }); // Store the paused position
    await this.soundObject.pauseAsync();
    Animated.timing(this.state.dotOffset).stop(); // Will also call animationPausedOrStopped()
  };

  startMovingDot = async () => {
    const status = await this.soundObject.getStatusAsync();
    const durationLeft = status["durationMillis"] - status["positionMillis"];

    Animated.timing(this.state.dotOffset, {
      toValue: { x: this.state.trackLayout.width, y: 0 },
      duration: durationLeft,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => this.animationPausedOrStopped());
  };

  animationPausedOrStopped = async () => {
    if (!this.state.playing) {
      return; // Audio has been paused
    }
    // Animation-duration is over (reset Animation and Audio):
    await sleep(200); // In case animation has finished, but audio has not
    this.setState({ playing: false });
    await this.soundObject.pauseAsync();
    await this.state.dotOffset.setValue({ x: 0, y: 0 });
    await this.soundObject.setPositionAsync(0); // Optionally reset to the start if needed
  };

  measureTrack = (event) => {
    this.setState({ trackLayout: event.nativeEvent.layout }); // {x, y, width, height}
  };

  async componentDidMount() {
    this.soundObject = new Audio.Sound();

    // await Audio.setAudioModeAsync({
    //   allowsRecordingIOS: false,
    //   playsInSilentModeIOS: true,
    //   staysActiveInBackground: true,
    //   interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    //   shouldDuckAndroid: true,
    //   playThroughEarpieceAndroid: false,
    //   outputAudioPort: Audio.OUTPUT_AUDIO_PORT_SPEAKER, // 👈 Forces loudspeaker
    // });
    //    console.log('Im here')
    //     await this.soundObject
    //       .loadAsync({ uri: this.props.audio.uri })
    //       .then((res) => console.log("sound is loaded", res))
    //       .catch((e) => console.log("error while loading :", e));
    const status = await this.soundObject.getStatusAsync();
    this.setState({ duration: status["durationMillis"] });

    // This requires measureTrack to have been called.
    this.state.dotOffset.addListener(() => {
      let animatedCurrentTime = this.state.dotOffset.x
        .interpolate({
          inputRange: [0, this.state.trackLayout.width],
          outputRange: [0, this.state.duration],
          extrapolate: "clamp",
        })
        .__getValue();
      this.setState({ currentTime: animatedCurrentTime });
    });
  }

  async componentWillUnmount() {
    await this.soundObject.unloadAsync();
    this.state.dotOffset.removeAllListeners();
  }

  render() {
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: 35,
            width: "95%",
          }}
        >
          <TouchableOpacity
            style={{
              zIndex: 2,
              paddingHorizontal: 5,
            }}
            onPress={this.onPressPlayPause}
          >
            {this.state.playing ? (
              <Ionicons name="pause" size={30} color="black" />
            ) : (
              <Ionicons name="play" size={30} color="black" />
            )}
          </TouchableOpacity>

          <Animated.View
            onLayout={this.measureTrack}
            style={{
              flex: 8,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              height: TRACK_SIZE,
              borderRadius: TRACK_SIZE / 2,
              backgroundColor: "#1490FF",
            }}
          >
            <Animated.View
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                position: "absolute",
                left: -((THUMB_SIZE * 4) / 2.2),
                width: THUMB_SIZE * 4,
                height: THUMB_SIZE * 4,
                transform: [
                  {
                    translateX: this.state.dotOffset.x.interpolate({
                      inputRange: [
                        0,
                        this.state.trackLayout.width != undefined
                          ? this.state.trackLayout.width
                          : 1,
                      ],
                      outputRange: [
                        0,
                        this.state.trackLayout.width != undefined
                          ? this.state.trackLayout.width
                          : 1,
                      ],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              }}
              {...this._panResponder.panHandlers}
            >
              <View
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                  backgroundColor: "rgba(0, 187, 255, 1)",
                }}
              ></View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }
}
