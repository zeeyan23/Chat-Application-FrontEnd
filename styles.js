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

import {StyleSheet} from 'react-native';

export const standardsStylesObject = {
    backgroundColor: "white",
    borderColor: "grey",
    color: "black",
    borderRadius: 5,
    borderWidth: 0.5,
    fontSizeNormal: 17,
};

const styles = StyleSheet.create({
    StandardText: {
        fontSize: standardsStylesObject.fontSizeNormal,
        padding: 6,
        color: standardsStylesObject.color
    },
    StandardContainer: {
        borderRadius: standardsStylesObject.borderRadius,
        borderWidth: standardsStylesObject.borderWidth,
        borderColor: standardsStylesObject.borderColor,
        backgroundColor: standardsStylesObject.backgroundColor,
        marginLeft: 10,
        marginRight: 10
    },
});

export default styles