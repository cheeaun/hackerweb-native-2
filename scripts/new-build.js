let oldAppJSON = {};
try {
  oldAppJSON = require('../__build-artifact__/app.json');
} catch (e) {
  process.exit(1);
}
const newAppJSON = require('../app.json');

if (oldAppJSON.expo.ios.buildNumber === newAppJSON.expo.ios.buildNumber) {
  process.exit(1);
} else {
  console.log('🚀 The "buildNumber" has changed. Initiating new build.');
}
