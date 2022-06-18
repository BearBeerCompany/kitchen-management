const fs = require("fs");
const {Notification} = require('electron');

async function addFiles() {

  // fs.writeFile(`${__dirname}/test.txt`, content, err => {
  //   if (err) {
  //     console.error(err);
  //   }
  //   // file written successfully
  // });

  // display notification
  filesAdded();
  return Promise.resolve("Hello");
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
