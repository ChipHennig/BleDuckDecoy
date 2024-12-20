import React, { Component } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default class PowerButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const button = () => {
            if (!this.props.isOn) {
                return (
                    <View style={styles.buttonContainer}>
                        <View style={styles.leftItem}>
                            <TouchableOpacity
                                style={styles.onButton}
                                onPress={() =>
                                    this.props.handleOn(
                                        this.props.num,
                                        this.props.module,
                                    )
                                }>
                                <Text style={styles.text}>On </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sliderItem}>
                            <Slider
                                value={this.props.runTime}
                                step={1}
                                minimumValue={3}
                                maximumValue={10}
                                onValueChange={(value) =>
                                    this.props.setRelayRuntime(
                                        this.props.num,
                                        value,
                                    )
                                }
                            />
                            <Text style={styles.timeText}>
                                {this.props.runTime} sec
                                </Text>
                        </View>
                        <View style={styles.sliderItem}>
                            <Slider
                                value={this.props.offDelay}
                                step={1}
                                minimumValue={3}
                                maximumValue={10}
                                onValueChange={(value) =>
                                    this.props.setRelayOffdelay(
                                        this.props.num,
                                        value,
                                    )
                                }
                            />
                            <Text style={styles.timeText}>
                                {this.props.offDelay} sec
                                </Text>
                        </View>
                    </View>
                );
            } else {
                return (
                    <View style={styles.buttonContainer}>
                        <View style={styles.leftItem}>
                            <TouchableOpacity
                                style={styles.offButton}
                                onPress={() =>
                                    this.props.handleOff(
                                        this.props.num,
                                        this.props.module,
                                    )
                                }>
                                <Text style={styles.text}>Off</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.rightItem}>
                            <Text style={styles.text}>RUNNING</Text>
                        </View>
                    </View>
                );
            }
        };

        return button();
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        paddingBottom: hp('5%')
    },
    leftItem: {
        flex: 1,
        alignContent: 'center'
    },
    sliderItem: {
        flex: 1,
        paddingRight: 20
    },
    rightItem: {
        flex: 2,
        paddingLeft: 40
    },
    onButton: {
        alignSelf: 'center',
        backgroundColor: '#00ff00',
        padding: 20,
    },
    offButton: {
        alignSelf: 'center',
        backgroundColor: '#ff0000',
        padding: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    timeText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
