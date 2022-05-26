const fs = require('fs');

function base64_encode(file) {
  return 'data:image/gif;base64,' + fs.readFileSync(file, 'base64');
}

function stringToFile(base64String) {
  fs.writeFile(
    'image.txt',
    base64String,
    { encoding: 'base64' },
    function (err) {}
  );
}

var base64str = base64_encode('test-file.txt');
let base64String = base64str.split(';base64,').pop();

stringToFile(base64String);
