const { exec } = require('child_process');
const appJSON = require('./app.json');

const ref = process.env.GITHUB_REF;
// Inspired by https://github.com/FranzDiebold/github-env-vars-action
function getRefName(ref) {
  return ref ? ref.split('/').slice(2).join('/') : null;
}
const {
  expo: { version },
} = appJSON;

if (ref) {
  const refName = getRefName(ref);
  const channel = /^prod/i.test(refName) ? 'production' : 'staging';
  if (version) {
    console.log(`${channel}-${version}`);
  } else {
    throw new Error('No version');
  }
} else {
  // https://stackoverflow.com/a/62228183/20838
  exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
    if (err) {
      throw err;
    }

    if (typeof stdout === 'string' && stdout && version) {
      const channel = /prod/i.test(stdout.trim()) ? 'production' : 'staging';
      console.log(`${channel}-${version}`);
    } else {
      throw new Error('No branch name');
    }
  });
}
