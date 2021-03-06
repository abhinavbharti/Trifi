const WiFiControl = require( 'wifi-control');
const request = require('request');
const _find = require('lodash/find');
const serverUri = '35.190.181.97';
const serverPort = 80// process.env.SERVER_PORT || 3000;
const endpoint = `http://${serverUri}:${serverPort}`;

WiFiControl.init({
  debug: true,
});

const beacons = [
  {
    ssid: 'Saul',
    location: [2.7, 0],
    data: [],
    correction: 0,
  },
  {
    ssid: 'Nathan\'s iPhone',
    location: [0, 0],
    data: [],
    correction: 1,
  },
  {
    ssid: 'H Wildermuth',
    location: [0, 2.7],
    data: [],
    correction: 2.5,
  },
];

searchForWifi();

/**
 * Searches for Wifi
 */
function searchForWifi() {
  WiFiControl.resetWiFi((err, res) => {
    if (err) {
      console.log(err);
    }
    WiFiControl.connectToAP({ ssid: 'PennApps' }, (err, res) => {
      if (err) {
        console.log(err);
      }
      WiFiControl.scanForWiFi((err, res) => {
        if (err) {
          console.log(err);
        }
        prepareDataForServer(res.networks);
      });
    });
  });
}

/**
 * Pretty prints the found networks
 * @param networks an array of found networks
 */
function prepareDataForServer(networks) {
  const ssidWhitelist = beacons.map(({ ssid }) => ssid);
  const foundWhitelistedNetworks = [];
  const pretty =
    networks
      .filter(({ ssid }) => {
        // Check whether SSID is in whitelist
        // (i.e. ssid of one of the beacons)
        return (ssidWhitelist.indexOf(ssid) !== -1);
      })
      .map(({ ssid, signal_level }) => {
        const beacon = _find(beacons, ['ssid', ssid]);
        // beacon.data.push(signal_level);
        // console.log(beacon.ssid + ': ' + beacon.data);
        foundWhitelistedNetworks.push(ssid);
        return {
          ssid,
          signal_level,
          timestamp: (new Date()),
          location: beacon.location,
          correction: beacon.correction,
        };
      });
  console.log(`Found networks: ${foundWhitelistedNetworks}`);
  sendDataToServer(pretty);
}

function sendDataToServer(data) {
  request.post(`${endpoint}/api/data`, {
    form: {
      data,
    },
  }, (err, response, body) => {
    if (err) {
      if (err.code === 'ECONNREFUSED') {
        return console.error(`It appears that the server at ${endpoint} is not running.`);
      }
      return console.error(err);
    }
    return console.log('Response from server: ' + body);
  });

  setTimeout(searchForWifi, 1000);
}
