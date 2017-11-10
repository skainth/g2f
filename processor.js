var fs = require('fs');
var mm = require('musicmetadata');

module.exports = {
  process: function (file, callback) {
    console.log('processing', file);
    mm(fs.createReadStream(file), function (err, metadata) {
      var data = {filepath: file};
      if (err) {
        return callback && callback(err, data);
      }
      if (callback) {
        if (metadata)
          data.metadata = metadata;

        fs.stat(file, function (fsStatErr, stats) {
          if (fsStatErr)
            callback(fsStatErr, data);
          else {
            data.mtime = stats.mtime.getTime();
            data.ctime = stats.ctime.getTime();

            data.mtimeAsString = new Date(stats.mtime.getTime());
            data.ctimeAsString = new Date(stats.ctime.getTime());
            // MergeRecursive(data, stats);
            setTimeout(() => {
              callback(fsStatErr, data);
            }, 500)

          }
          //console.log(err, file, stats.mtime, Date.parse(stats.mtime));
        });
      }
    });
  }
};

/*
 * Recursively merge properties of two objects
 */
function MergeRecursive(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor == Object) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch (e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}
