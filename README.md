# BleDuckDecoy

A mobile-controller for (currently [DSD Tech](https://www.amazon.com/DSD-TECH-Channels-Bluetooth-Compatible/dp/B07GFH5J96)) Bluetooth-Low-Energy relay boards.

module = BLE board

<img alt="current UI" src="/docs/ui_9-22-2020.PNG" height="33%" width="33%" />

Current features:
- Connect button: Connects to any # of DSD BLE boards
  - Modal: select if module has 1 or 4 relays
  - Dropdown: select a module
- On/Off buttons: turns on/off relay-timer for selected module
  - A running relay-timer switches the relay between on and off states
- Sliders: adjust the on-time/off-time for the relay-timer
- Kill button: turns off all relay-timers for all modules

Utilizes: 
- [ReactNative BLE API](https://github.com/Polidea/react-native-ble-plx)
- [Background timers](https://github.com/ocetnik/react-native-background-timer) so relay-timers can run while app is in background

Backlog:
- Invoke kill button handler when app is terminated
- UI for beta-test
  - Finish connect-modal (add spinner)
  - Logo
- Deploy to beta-test
  - Testflight
- Update for new BLE boards
  - e.g. motor speed functionality
- UI
  - Add menu and/or settings
  - Add user preferences (e.g. background photos)
- Create a backend for user authentication
  - Save user preferences
  - User analytics
- Create documentation?
