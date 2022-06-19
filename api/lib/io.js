const fs = require("fs");
const {Notification} = require('electron');
const os = require("os");

async function addFiles(_, config) {

  const row = `{name:${config.name}, color:${config.name}}\r\n`;

  fs.appendFile(`${os.homedir()}/Documents/test.txt`, row, err => {
    if (err) {
      return Promise.resolve("Error!");
    }
    // file written successfully
  });

  // display notification
  filesAdded();
  return Promise.resolve("Saved!");
}

const filesAdded = () => {
  const notif = new Notification({
    title: 'Files added',
    body: `file(s) has been successfully added.`
  });

  notif.show();
};

module.exports = {
  addFiles
}
