import React, { Component } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default class PowerButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const button = () => {
            if (!this.props.isOn) {
                return (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.onButton}
                            onPress={() =>
                                this.props.handleOn(this.props.num, this.props.timeInterval)
                            }>
                            <Text style={styles.text}>On</Text>
                        </TouchableOpacity>
                        <View>
                            <Slider
                                style={styles.rightItem}
                                value={3}
                                step={1}
                                minimumValue={3}
                                maximumValue={10}
                                onValueChange={(value) =>
                                    this.props.setRelayInterval(this.props.num, value)
                                }
                            />
                            <Text style={styles.time}>{this.props.timeInterval} sec</Text>
                        </View>
                    </View>
                );
            } else {
                return (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.offButton}
                            onPress={() => this.props.handleOff(this.props.num)}>
                            <Text style={styles.text}>Off</Text>
                        </TouchableOpacity>
                        <Text style={styles.rightItem}>RUNNING</Text>
                    </View>
                );
            }
        }

        return (
            <View>
                <Text style={styles.text} >Duck {this.props.num} Timer</Text>
                {button()}
            </View >
        );
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center"
    },
    onButton: {
        alignSelf: "flex-start",
        alignItems: "center",
        backgroundColor: "#00ff00",
        padding: 20
    },
    offButton: {
        alignItems: "center",
        backgroundColor: "#ff0000",
        padding: 20
    },
    rightItem: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 200
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    time: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
