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
        this.timerInterval = this.timerInterval.bind(this);
        this.stopTimer = this.stopTimer.bind(this);
        this.setRelayRuntime = this.setRelayRuntime.bind(this);
        this.setRelayOffdelay = this.setRelayOffdelay.bind(this);
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
                runTime: 3,
                offDelay: 3,
                timeoutId: '',
            });
        }
        let modules = this.state.modules;
        modules = modules.set(deviceId, relays);
        this.setState({ modules: modules });
    }

    // removeModule(deviceId) {
    //     if (this.state.modules.has(deviceId)) {
    //         // TODO
    //     }
    // }

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

    timerInterval(relayNum, module) {
        let relays = [...this.state.modules.get(module)];
        let relay = relays[relayNum - 1];
        let timeoutId = '';
        let interval = 0;
        if (!relay.isOn) {
            this.relayOn(relayNum, module);
            interval = relay.runTime;
        } else {
            this.relayOff(relayNum, module);
            interval = relay.offDelay;
        }
        if (Platform.OS === 'ios') {
            timeoutId = setTimeout(this.timerInterval, interval * 1000, relayNum, module);
        } else {
            timeoutId = BackgroundTimer.setTimeout(this.timerInterval, interval * 1000, relayNum, module);
        }
        relays[relayNum - 1] = {
            ...relay[relayNum - 1],
            timeoutId: timeoutId,
            runTime: relay.runTime,
            offDelay: relay.offDelay,
            timerIsOn: true,
            isOn: !relay.isOn
        };
        this.updateRelays(relays, module);
    }

    stopTimer(relayNum, module) {
        let relays = [...this.state.modules.get(module)];
        let relay = relays[relayNum - 1];
        if (Platform.OS === 'ios') {
            clearTimeout(relay.timeoutId);
        } else {
            BackgroundTimer.clearTimeout(relay.timeoutId);
        }
        relays[relayNum - 1] = {
            ...relay[relayNum - 1],
            timeoutId: '',
            runTime: relay.runTime,
            offDelay: relay.offDelay,
            timerIsOn: false,
            isOn: false
        };
        this.updateRelays(relays, module);
        this.relayOff(relayNum, module);
    }

    setRelayRuntime(relayNum, interval) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = {
            ...relays[relayNum - 1],
            runTime: interval,
        };
        this.updateRelays(relays, this.state.currentModule);
    }

    setRelayOffdelay(relayNum, interval) {
        let relays = [...this.state.modules.get(this.state.currentModule)];
        relays[relayNum - 1] = {
            ...relays[relayNum - 1],
            offDelay: interval,
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
                                runTime={relay.runTime}
                                offDelay={relay.offDelay}
                                isOn={relay.timerIsOn}
                                handleOn={this.timerInterval}
                                handleOff={this.stopTimer}
                                setRelayRuntime={
                                    this.setRelayRuntime
                                }
                                setRelayOffdelay={this.setRelayOffdelay}
                            ></PowerButton>
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
                        style={{ height: hp('15%') }}
                        itemStyle={{ height: hp('15%') }}
                        selectedValue={this.state.currentModule}
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

        let sliderColumnText = () => {
            if (this.state.modules.has(this.state.currentModule)) {
                return (<View style={{ flexDirection: 'row' }}>
                    <Text style={{ flex: 1 }}></Text>
                    <Text style={[styles.mediumText, { flex: 1, paddingRight: 20 }]}>Run-time</Text>
                    <Text style={[styles.mediumText, { flex: 1, paddingRight: 20 }]}>Off-delay</Text>
                </View>);
            } else {
                return <View />;
            }
        }

        return (
            <View style={styles.pageView}>
                <Modal isVisible={this.state.showConnectModal}>
                    <View>
                        <Text style={styles.mediumText}>Number of ducks?</Text>
                        <View>
                            <SegmentedControls
                                options={['1', '4']}
                                onSelection={this.setNumDucks.bind(this)}
                                selectedOption={this.state.numDucks}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => this.connectModalSubmit()}>
                            <Text style={[styles.mediumText, { color: 'blue' }]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: 'blue' }]}
                        onPress={() => this.scanAndConnect()}>
                        <Text style={[styles.mediumText, { color: 'white' }]}>Connect</Text>
                    </TouchableOpacity>
                    {/* <Image
                        style={styles.image}
                        source={require('../../assets/duck_pic.png')}
                    /> */}
                    {modulePicker()}
                </View>

                <View style={styles.body}>
                    {sliderColumnText()}
                    {buttons()}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    pageView: {
        flex: 1,
        backgroundColor: '#ecf0f1',
        justifyContent: 'center',
    },
    header: {
        flex: 1,
        justifyContent: 'center',
    },
    body: {
        flex: 2
    },
    button: {
        padding: 20,
        alignSelf: 'center'
    },
    mediumText: {
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
