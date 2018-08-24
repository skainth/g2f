"use strict";
const fs = require('fs-extra');

module.exports = {
  // Filter out files based upon extensions
  fileFilter: (allFiles, config) => {
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
    fs.writeJSONSync(filename, data, {spaces: 2, EOL: '\r\n'});
  },
  objectLength: (object) => Object.keys(object || {}).length
};
