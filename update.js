const jsonfile = require('jsonfile');
const config = require('./config');
const CONSTANTS = require('./constants');
const analytics = require('./analytics');
const getDbFileName = require('./helper/path');

const log = console.log;
const statsFileName = 'stats.json';
const dbFileName = getDbFileName(config);
const updateAvailableFileName = `${config.source}/update`;

const db = jsonfile.readFileSync(dbFileName);
const stats = jsonfile.readFileSync(statsFileName);

const dbFiles = db.files;

// find all those files which are in target but not in source
for(let filepath in dbFiles){
  const dbFile = dbFiles[filepath];
  const { targets = [] } = dbFile;
  if(!stats[CONSTANTS.FILES_TO_PROCESS][filepath]){
    targets.forEach(targetPath => {
      analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, targetPath);
      log('deleted from source', targetPath);
    });
  }
}

// changed files
// 1. Delete from target
// 2. Copy from source
// update mtime, ctime

const changedFiles = stats[CONSTANTS.FILE_CHANGED];

if(changedFiles && Object.keys(changedFiles).length){
  for(let filepath in changedFiles){
    const changedFile = changedFiles[filepath] || {};
    const { targets = [] } = changedFile;
    targets.forEach(targetPath => {
      analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, targetPath);
      log('changed in source', targetPath);
      analytics.add(CONSTANTS.FILE_CHANGED, changedFile, 'filepath');
    });
  };
}else{
  log('no changed files');
}

// New files
// 1. copy from source to target

const newFiles = stats[CONSTANTS.FILE_NEW];

if(newFiles && Object.keys(newFiles).length){
  for(let filepath in newFiles){
    const newFile = newFiles[filepath] || {};

    analytics.add(CONSTANTS.FILE_NEW, newFile, 'filepath');
  }
}else{
  log('no new files');
}

// After deleting file from target, check if the containing folder is empty

const filesToDelete = analytics.list(CONSTANTS.FILE_TO_DELETE_FROM_TARGET);
log('delete from target', filesToDelete);
log('changed', analytics.list(CONSTANTS.FILE_CHANGED));
log('new', analytics.list(CONSTANTS.FILE_NEW));

const filesToCopy = Object.assign({}, analytics.list(CONSTANTS.FILE_CHANGED), analytics.list(CONSTANTS.FILE_NEW));

log('files to copy', filesToCopy);

if(Object.keys(Object.assign({}, filesToCopy, filesToDelete)).length){
  log('update available');
  jsonfile.writeFileSync(updateAvailableFileName, '');
}
