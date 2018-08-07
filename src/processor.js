var fs = require('fs');
var mm = require('musicmetadata');

module.exports = {
  process: function (file, callback) {
    mm(fs.createReadStream(file), function (err, metadata) {
      var data = {filepath: file};
      if (err) {
        return callback && callback(err, data);
      }
      if (callback) {
        if (metadata) {
          const {genre = [], artist = '', title = '', album = ''} = metadata;
          data.metadata = {title, artist, genre, album};
        }

        fs.stat(file, function (fsStatErr, stats) {
          if(!fsStatErr){
            data.mtime = stats.mtime.getTime();
            data.ctime = stats.ctime.getTime();
          }
          callback(fsStatErr, data);
        });
      }
    });
  }
};
