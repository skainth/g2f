"use strict";
const jsonfile = require('jsonfile');

module.exports = {
  // Filter out files based upon extensions
  fileFilter: (allFiles, config, db) => {
    const filteredFiles = {keep: [], ignore: []};
    allFiles.forEach((fileName) => {
      const dotAt = fileName.lastIndexOf('.');
      if (dotAt !== -1) {
        const extension = fileName.substr(dotAt + 1).toLowerCase();
        if(config.allowedExtentions.indexOf(extension) !== -1){
          filteredFiles.keep.push(fileName);
        }else{
          filteredFiles.ignore.push(fileName);
        }
      } else {
        filteredFiles.ignore.push(fileName);
      }
    });
    return filteredFiles;
  },
  arrayIterate: (array, processingFn, callback, done) => {
    let index = 0;

    function next() {
      if (index + 1 === array.length) {
        done();
      } else {
        processingFn(array[++index], internalFn);
      }
    }

    function internalFn() {
      const argsArray = Array.from(arguments);
      argsArray.push(next);
      callback.apply(null, argsArray);
    }

    processingFn(array[index], internalFn);
  },
  writeJSONToFile: (data, filename) => {
    jsonfile.writeFileSync(filename, data, {spaces: 2, EOL: '\r\n'});
  }
};
