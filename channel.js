const appJSON = require('./app.json');
const ref = process.env.GITHUB_REF;

// Inspired by https://github.com/FranzDiebold/github-env-vars-action
function getRefName(ref) {
  return ref ? ref.split('/').slice(2).join('/') : null;
}

const {
  expo: { version },
} = appJSON;
const refName = getRefName(ref);
const channel = /^prod/i.test(refName) ? 'production' : 'staging';
console.log(`${channel}-${version}`);
