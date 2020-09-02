import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-community/picker';
import Modal from 'react-native-modal';
import { SegmentedControls } from 'react-native-radio-buttons';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import BackgroundTimer from 'react-native-background-timer';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PowerButton from './PowerButtonComponent';

export default class Main extends Component {
    constructor() {
        super();
        this.manager = new BleManager();
        this.state = {
            modules: new Map(),
            currentModule: '',
            showConnectModal: false,
            numDucks: '4',
        };
        this.startTimer = this.startTimer.bind(this);
        this.stopTimer = this.stopTimer.bind(this);
        this.setRelayInterval = this.setRelayInterval.bind(this);
    }

    componentDidMount() {
        // Test
        // this.addModule('123', 4);
        // this.switchModule('123');
        /**
         * For iOS startup
         */
        if (Platform.OS === 'ios') {
            const subscription = this.manager.onStateChange((state) => {
                if (state === 'PoweredOn') {
                    subscription.remove();
                }
            }, true);
            BackgroundTimer.start();
        }
    }

    componentWillUnmount() {
        // TODO Turn off relays
        // TODO Disconnect all gets an error when called
        // this.manager.devices().forEach((device) => {
        //     device.cancelConnection();
        // });
    }

    setNumDucks(num) {
        this.setState({ numDucks: num });
    }

    toggleModal() {
        this.setState({ showConnectModal: !this.state.showConnectModal });
    }

    connectModalSubmit() {
        this.addModule(this.state.currentModule, parseInt(this.state.numDucks));
        this.toggleModal();
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
        this.setState({ modules: modules });
    }

    removeModule(deviceId) {
        if (this.state.modules.has(deviceId)) {
            // TODO
        }
    }

    switchModule(deviceId) {
        // if (this.state.modules.has(deviceId)) {
        //     this.setState({currentModule: deviceId});
        // }
        this.setState({ currentModule: deviceId });
    }

    updateRelays(relays, module) {
        let modules = this.state.modules;
        modules.set(module, relays);
        this.setState({ modules: modules });
    }

    startTimer(relayNum, module) {
        this.relayOn(relayNum, module);
        let relays = [...this.state.modules.get(module)];
        let relay = relays[relayNum - 1];
        let onInterval = true;
        const startInterval = (callback, interval) => {
            if (Platform.OS === 'ios') {
                return setInterval(callback, interval);
            } else {
                return BackgroundTimer.setInterval(callback, interval);
            }
        };
        let intervalId = startInterval(() => {
            if (onInterval) {
                this.relayOff(relayNum, module);
                onInterval = false;
            } else {
                this.relayOn(relayNum, module);
                onInterval = true;
            }
        }, relay.timeInterval * 1000);
        relays[relayNum - 1] = {
            ...relays[relayNum - 1],
            timeoutId: intervalId,
            timerIsOn: true,
        };
        this.updateRelays(relays, module);
    }

    stopTimer(relayNum, module) {
        let relays = [...this.state.modules.get(module)];
        let relay = relays[relayNum - 1];
        if (Platform.OS === 'ios') {
            clearInterval(relay.timeoutId);
        } else {
            BackgroundTimer.clearInterval(relay.timeoutId);
        }
        relays[relayNum - 1] = {
            ...relay[relayNum - 1],
            timeoutId: '',
            timeInterval: relay.timeInterval,
            timerIsOn: false,
        };
        this.updateRelays(relays, module);
        this.relayOff(relayNum, module);
    }

    setRelayInterval(relayNum, interval) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = {
            ...relays[relayNum - 1],
            timeInterval: interval,
        };
        this.updateRelays(relays, this.state.currentModule);
    }

    relayOn(relayNum, module) {
        let code = 'A00' + relayNum + '01A' + (relayNum + 1);
        let relays = [...this.state.modules.get(module)];
        relays[relayNum - 1] = { ...relays[relayNum - 1], isOn: true };
        this.updateRelays(relays, module);
        this.writeHex(code, module);
    }

    relayOff(relayNum, module) {
        let code = 'A00' + relayNum + '00A' + relayNum;
        let relays = [...this.state.modules.get(module)];
        relays[relayNum - 1] = { ...relays[relayNum - 1], isOn: false };
        this.updateRelays(relays, module);
        this.writeHex(code, module);
    }

    writeHex(hex, module) {
        let base64String = Buffer.from(hex, 'hex').toString('base64');
        return this.manager.writeCharacteristicWithoutResponseForDevice(
            module,
            'FFE0',
            'FFE1',
            base64String,
        );
    }

    scanAndConnect() {
        this.manager.startDeviceScan(null, null, (error, device) => {
            if (!error) {
                if (
                    device.name === 'DSD Relay' &&
                    !this.state.modules.has(device.id)
                ) {
                    this.manager.stopDeviceScan();
                    this.manager
                        .connectToDevice(device.id)
                        .then((d) => {
                            return d.discoverAllServicesAndCharacteristics();
                        })
                        .then((d) => {
                            this.toggleModal();
                            this.switchModule(d.id);
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
            if (this.state.modules.has(this.state.currentModule)) {
                let btns = this.state.modules
                    .get(this.state.currentModule)
                    .map((relay, index) => {
                        return (
                            <PowerButton
                                key={
                                    this.state.currentModule + index.toString()
                                }
                                module={this.state.currentModule}
                                num={index + 1}
                                timeInterval={relay.timeInterval}
                                isOn={relay.timerIsOn}
                                handleOn={this.startTimer}
                                handleOff={this.stopTimer}
                                setRelayInterval={
                                    this.setRelayInterval
                                }></PowerButton>
                        );
                    });
                return btns;
            } else {
                return <View />;
            }
        };

        let modulePicker = () => {
            if (this.state.modules.has(this.state.currentModule)) {
                let mods = [...this.state.modules.keys()].map((id, index) => {
                    return (
                        <Picker.Item
                            key={id}
                            label={
                                this.state.modules.get(id).length +
                                '-relay module (' +
                                (index + 1).toString() +
                                ')'
                            }
                            value={id}
                        />
                        // X button for removeModule?
                        // <TouchableOpacity
                        //     // style={styles.connect}
                        //     // onPress={() => this.scanAndConnect()}
                        //     >
                        //         <Image
                        //             source={require('../../assets/x_symbol.png')}
                        //         />
                        //         <Text style={styles.paragraph}>
                        //             Duck Decoys
                        //         </Text>
                        // </TouchableOpacity>
                    );
                });
                return (
                    <Picker
                        selectedValue={this.state.currentModule}
                        style={styles.modPicker}
                        onValueChange={(itemValue, itemIndex) =>
                            this.switchModule(itemValue)
                        }>
                        {mods}
                    </Picker>
                );
            } else {
                return <View />;
            }
        };

        return (
            <View style={styles.container}>
                <Modal isVisible={this.state.showConnectModal}>
                    <View style={styles.modalCard}>
                        <Text style={styles.paragraph}>Number of ducks?</Text>
                        <View style={{ alignSelf: 'center', width: wp('50%') }}>
                            <SegmentedControls
                                options={['1', '4']}
                                onSelection={this.setNumDucks.bind(this)}
                                selectedOption={this.state.numDucks}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.okBtn}
                            onPress={() => this.connectModalSubmit()}>
                            <Text style={styles.okText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

                <View style={styles.header}>
                    <Text style={styles.paragraph}>Duck Decoys</Text>

                    <TouchableOpacity
                        style={styles.connect}
                        onPress={() => this.scanAndConnect()}>
                        <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>

                    {modulePicker()}

                    <Image
                        style={styles.image}
                        source={require('../../assets/duck_pic.png')}
                    />
                </View>

                {buttons()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignContent: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#ecf0f1',
    },
    header: {
        flex: 1,
        height: hp('20%'),
        justifyContent: 'flex-start'
    },
    modalCard: {
        height: hp('40%'),
        width: wp('70%'),
        alignSelf: 'center',
        alignContent: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: '#ecf0f1',
    },
    okBtn: {
        alignSelf: 'center',
        alignItems: 'center',
        padding: 30
    },
    okText: {
        color: 'blue',
        fontWeight: 'bold',
        fontSize: 18,
    },
    connect: {
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: '#0080ff',
        padding: 20,
    },
    connectText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modPicker: {
        alignSelf: 'center',
        height: 20,
        width: 165,
        marginBottom: 10,
    },
    paragraph: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    image: {
        alignSelf: 'center',
        width: 50,
        height: 50,
        resizeMode: 'center',
    },
});
