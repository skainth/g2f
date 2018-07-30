/**
 * Created by z001hmj on 2/8/16.
 */
var jsonfile = require('jsonfile');
const fs = require('fs');
const fs_extra = require('fs-extra');

const emptyDb = {files: []};

function DB(dataFile, callback) {
  var data = emptyDb;

  jsonfile.readFile(dataFile, function (err, fileData) {
    if (err) {
      fs_extra.writeJson(dataFile, emptyDb, function (err) {
        callback && callback(err);
      })
    } else {
      if (typeof fileData == "string")
        data = JSON.parse(fileData);
      else
        data = fileData; //Assume it is valid JSON
    }

    callback(err, data);
  });
  this.save = function (key, value) {
    data[key] = value;
  };
  this.remove = function (key) {
    delete data[key];
  };
  this.get = function (filePath) {
    return data[filePath];
  };
  this.persist = function (cb) {
    jsonfile.writeFileSync(dataFile, data);
    cb && cb();
  };
  this.keys = function (callback) {
    callback && callback(Object.keys(data));
  };
  this.delKeysSync = function (keys) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    keys.forEach(function (key) {
      delete data[key];
    });
  };
  this.clear = function () {
    data = {};
  }
}

module.exports = DB;
