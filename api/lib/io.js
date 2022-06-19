const fs = require("fs");
const {Notification} = require('electron');
const os = require("os");
const readline = require('readline');
const filePath = `${os.homedir()}/Documents/plate-config.txt`

async function addPlate(_, config) {

  const row = `${JSON.stringify(config)}\r\n`;

  await fs.appendFile(filePath, row, err => {
    if (err) {
      return Promise.resolve("Error!");
    }
    // file written successfully
  });

  // display notification
  filesAdded();
  return Promise.resolve("Saved!");
}

async function readPlates(_) {
  const platesList = []
  try {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line !== "")
        platesList.push(JSON.parse(line));
    }

    return Promise.resolve(platesList);
  } catch (e) {
    return Promise.resolve(platesList);
  }
}

const filesAdded = () => {
  const notif = new Notification({
    title: 'Files added',
    body: `file(s) has been successfully added.`
  });

  notif.show();
};

module.exports = {
  addPlate,
  readPlates
}
