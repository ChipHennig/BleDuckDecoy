import React, { Component } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import PowerButton from './PowerButtonComponent';

export default class Main extends Component {
    constructor() {
        super();
        this.manager = new BleManager();
        this.state = {
            modules: new Map(),
            currentModule: '',
        };
        this.startTimer = this.startTimer.bind(this);
        this.stopTimer = this.stopTimer.bind(this);
        this.setRelayInterval = this.setRelayInterval.bind(this);
    }

    componentDidMount() {
        this.addModule('123', 4);
        this.switchModule('123');
        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scanAndConnect();
                subscription.remove();
            }
        }, true);
    }

    addModule(deviceId, numRelays) {
        let relays = [];
        for (let i = 0; i < numRelays; i++) {
            relays.push({
                timerIsOn: false,
                isOn: false,
                timeInterval: 3,
                timeoutId: '',
            });
        }
        let modules = this.state.modules;
        modules = modules.set(deviceId, relays);
        this.setState({modules: modules});
    }

    switchModule(deviceId) {
        if (this.state.modules.has(deviceId)) {
            this.setState({ currentModule: deviceId });
        }
    }

    updateRelays(relays) {
        let modules = this.state.modules;
        modules = modules.set(this.state.currentModule, relays);
        this.setState({modules: modules});
    }

    startTimer(relayNum) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        let relay = relays[relayNum - 1];
        let onInterval = true;
        let intervalId = setInterval(() => {
            if (onInterval) {
                this.relayOff(relayNum);
                onInterval = false;
            } else {
                this.relayOn(relayNum);
                onInterval = true;
            }
        }, relay.timeInterval * 1000);
        relays[relayNum - 1] = {
            ...relays[relayNum - 1],
            timeoutId: intervalId,
            timerIsOn: true,
        };
        this.updateRelays(relays);
    }

    stopTimer(relayNum) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        let relay = relays[relayNum - 1];
        clearInterval(relay.timeoutId);
        relays[relayNum - 1] = {
            ...relay[relayNum - 1],
            timeoutId: '',
            timeInterval: 3,
            timerIsOn: false,
        };
        this.updateRelays(relays);
        this.relayOff(relayNum);
    }

    setRelayInterval(relayNum, interval) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = { ...relays[relayNum - 1], timeInterval: interval };
        this.updateRelays(relays);
    }

    relayOn(relayNum) {
        let code = 'A00' + relayNum + '01A' + (relayNum + 1);
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = { ...relays[relayNum - 1], isOn: true };
        this.updateRelays(relays);
        // this.writeHex(code);
    }

    relayOff(relayNum) {
        let code = 'A00' + relayNum + '00A' + relayNum;
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = { ...relays[relayNum - 1], isOn: true };
        this.updateRelays(relays);
        // this.writeHex(code);
    }

    writeHex(hex) {
        let base64String = Buffer.from(hex, 'hex').toString('base64');
        return this.manager.writeCharacteristicWithoutResponseForDevice(
            this.state.currentModule,
            'FFE0',
            'FFE1',
            base64String,
        );
    }

    scanAndConnect() {
        this.manager.startDeviceScan(null, null, (error, device) => {
            if (!error) {
                if (device.name === 'DSD Relay') {
                    this.manager.stopDeviceScan();
                    this.manager
                        .connectToDevice(device.id)
                        .then((d) => {
                            return d.discoverAllServicesAndCharacteristics();
                        })
                        .then((d) => {
                            this.addModule(d.id, 4);
                            this.switchModule(d.id);
                            //return this.writeHex(d, 'A00100A1');
                        })
                        .then(() => {
                            // this.info('Listening...');
                        })
                        .catch((e) => {
                            // this.error(e.message);
                        });
                }
            } else {
                // this.error(error.message);
                return;
            }
        });
    }

    render() {
        let buttons = () => {
            if (this.state.currentModule.length > 0) {
                let btns = this.state.modules
                    .get(this.state.currentModule)
                    .map((relay, index) => {
                        return (
                            <PowerButton
                                key={this.state.currentModule + index.toString()}
                                num={index + 1}
                                timeInterval={relay.timeInterval}
                                isOn={relay.timerIsOn}
                                handleOn={this.startTimer}
                                handleOff={this.stopTimer}
                                setRelayInterval={this.setRelayInterval}>
                            </PowerButton>
                        );
                    });
                return btns;
            } else {
                return <View />;
            }
        }

        return (
            <View style={styles.container}>
                <Text style={styles.paragraph}>Duck Decoys</Text>

                {/* <TouchableOpacity>Connect</TouchableOpacity>
                <Picker
                    selectedValue={this.state.language}
                    style={{ height: 50, width: 100 }}
                    onValueChange={(itemValue, itemIndex) =>
                        this.setState({ language: itemValue })
                    }>
                    <Picker.Item label="Java" value="java" />
                    <Picker.Item label="JavaScript" value="js" />
                </Picker> */}

                <Image style={styles.image} source={require('../../assets/duck_pic.png')} />
                {buttons()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignContent: 'center',
        backgroundColor: '#ecf0f1',
        padding: 8,
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    image: {
        alignSelf: "center",
        width: 100,
        height: 100,
        resizeMode: 'center',
    },
});
