const fs = require("fs");
const {Notification} = require('electron');
const os = require("os");
const readline = require('readline');
const {uuidv4, removeElement} = require('./commons');
const filePath = `${os.homedir()}/Documents/plate-config.txt`

async function addPlate(_, config) {

  config._id = uuidv4();
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

    for await (const line of _getReaderInterface()) {
      if (line !== "")
        platesList.push(JSON.parse(line));
    }

    return Promise.resolve(platesList);
  } catch (e) {
    return Promise.resolve(platesList);
  }
}

async function readPlateById(_, id) {
  try {
    let plate = undefined;

    for await (const line of _getReaderInterface()) {
      if (line !== "" && line.includes(`"_id":"${id}"`)) {
        plate = JSON.parse(line);
        break;
      }
    }

    return Promise.resolve(plate);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function deletePlateById(_, id) {
  try {
    let foundIndex = undefined;

    await fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) {
        return Promise.reject(err);
      }

      let lines = data.split('\r\n');
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (line !== "" && line.includes(`"_id":"${id}"`)) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex !== undefined) {
        removeElement(lines, foundIndex)
        fs.writeFile(filePath, lines,
          function (err, data) {
            if (err) {
              return Promise.reject("Fail to write config file: " + err);
            }
          });
      } else {
        return Promise.resolve("Plate configuration not found");
      }
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

function updatePlate(_, config) {

}

function _getReaderInterface() {
  const fileStream = fs.createReadStream(filePath);

  return readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
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
  readPlates,
  readPlateById,
  deletePlateById,
  updatePlate
}
