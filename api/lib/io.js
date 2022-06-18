const fs = require("fs");
const {Notification} = require('electron');

exports.addFiles = () => {

  // fs.writeFile(`${__dirname}/test.txt`, content, err => {
  //   if (err) {
  //     console.error(err);
  //   }
  //   // file written successfully
  // });

  // display notification
  filesAdded();
};

const filesAdded = () => {
  const notif = new Notification({
    title: 'Files added',
    body: `file(s) has been successfully added.`
  });

  notif.show();
};
