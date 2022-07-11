const fs = require("fs");
const {Notification} = require('electron');
const os = require("os");
const readline = require('readline');
const {uuidv4} = require('./commons');
const platesFilePath = `${os.homedir()}/Documents/plate-config.txt`;
const ordersFilePath = `${os.homedir()}/Documents/orders.txt`;
const menuItemsFilePath = `${os.homedir()}/Documents/menu-items.txt`;

async function addPlate(_, config) {

  config._id = uuidv4();
  const row = `${JSON.stringify(config)}\r\n`;

  await fs.appendFile(platesFilePath, row, err => {
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
    for await (const line of _getReaderInterface(platesFilePath)) {
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

    for await (const line of _getReaderInterface(platesFilePath)) {
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

    await fs.readFile(platesFilePath, 'utf8', function (err, data) {
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
        lines.splice(foundIndex, 1);
        let linesAsString = lines.join("\r\n");
        fs.writeFile(platesFilePath, linesAsString,
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

async function updatePlate(_, config) {
  try {
    let foundIndex = undefined;

    await fs.readFile(platesFilePath, 'utf8', function (err, data) {
      if (err) {
        return Promise.reject(err);
      }

      let lines = data.split('\r\n');
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (line !== "" && line.includes(`"_id":"${config._id}"`)) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex !== undefined) {
        lines[foundIndex] = `${JSON.stringify(config)}`;
        let linesAsString = lines.join("\r\n");
        fs.writeFile(platesFilePath, linesAsString,
          function (err, data) {
            if (err) {
              return Promise.reject("Fail to write config file: " + err);
            }

          });
      } else {
        return Promise.resolve("Config not found");
      }
    });

    return Promise.resolve(config);
  } catch (e) {
    return Promise.reject(e);
  }
}

function _getReaderInterface(filePath) {
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

async function addOrder(_, order) {
  order._id = uuidv4();
  const row = `${JSON.stringify(order)}\r\n`;
  await fs.appendFile(ordersFilePath, row, err => {
    if (err) {
      return Promise.resolve("Error!");
    }
    // file written successfully
  });

  // display notification
  filesAdded();
  return Promise.resolve("Saved!");
}

async function addOrders(_, orders) {
  for (const orderKey in orders) {
    const order = orders[orderKey];
    await addOrder(_, order);
  }

  // display notification
  return Promise.resolve(orders);
}

async function readOrders(_) {
  const orders = [];
  try {
    for await (const line of _getReaderInterface(ordersFilePath)) {
      if (line !== "")
        orders.push(JSON.parse(line));
    }

    return Promise.resolve(orders);
  } catch (e) {
    return Promise.resolve(orders);
  }
}

async function readOrderById(_, id) {
  try {
    let order = undefined;

    for await (const line of _getReaderInterface(ordersFilePath)) {
      if (line !== "" && line.includes(`"_id":"${id}"`)) {
        order = JSON.parse(line);
        break;
      }
    }

    return Promise.resolve(order);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function deleteOrderById(_, id) {
  try {
    let foundIndex = undefined;

    await fs.readFile(ordersFilePath, 'utf8', function (err, data) {
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
        lines.splice(foundIndex, 1);
        let linesAsString = lines.join("\r\n");
        fs.writeFile(ordersFilePath, linesAsString,
          function (err, data) {
            if (err) {
              return Promise.reject("Fail to write order file: " + err);
            }
          });
      } else {
        return Promise.resolve("Order not found");
      }
    });

    return Promise.resolve(true);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function deleteOrdersByIds(_, ids) {
  try {
    await fs.readFile(ordersFilePath, 'utf8', function (err, data) {
      if (err) {
        return Promise.reject(err);
      }
      let foundIndex = undefined;
      let lines = data.split('\r\n');

      for (let j = 0; j < ids.length; j++) {
        const id = ids[j];

        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          if (line !== "" && line.includes(`"_id":"${id}"`)) {
            foundIndex = index;
            break;
          }
        }
        if (foundIndex !== undefined) {
          lines.splice(foundIndex, 1);
        }
      }

      let linesAsString = lines.join("\r\n");
      fs.writeFile(ordersFilePath, linesAsString,
        function (err, data) {
          if (err) {
            return Promise.reject("Fail to write order file: " + err);
          }
        });
    });

    return Promise.resolve(true);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function updateOrder(_, order) {
  try {
    let foundIndex = undefined;

    await fs.readFile(ordersFilePath, 'utf8', function (err, data) {
      if (err) {
        return Promise.reject(err);
      }

      let lines = data.split('\r\n');
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (line !== "" && line.includes(`"_id":"${order._id}"`)) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex !== undefined) {
        lines[foundIndex] = `${JSON.stringify(order)}`;
        let linesAsString = lines.join("\r\n");
        fs.writeFile(ordersFilePath, linesAsString,
          function (err, data) {
            if (err) {
              return Promise.reject("Fail to write order file: " + err);
            }

          });
      } else {
        return Promise.resolve("Order not found");
      }
    });

    return Promise.resolve(order);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function readMenuItems(_) {
  const menuItems = [];
  try {
    for await (const line of _getReaderInterface(menuItemsFilePath)) {
      if (line !== "")
        menuItems.push(JSON.parse(line));
    }

    return Promise.resolve(menuItems);
  } catch (e) {
    return Promise.resolve(menuItems);
  }
}

module.exports = {
  addPlate,
  readPlates,
  readPlateById,
  deletePlateById,
  updatePlate,
  addOrder,
  addOrders,
  readOrders,
  readOrderById,
  deleteOrderById,
  deleteOrdersByIds,
  updateOrder,
  readMenuItems
}
