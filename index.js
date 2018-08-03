"use strict";
const path = require('path');
const jsonfile = require('jsonfile');
const recursive = require('recursive-readdir');
const fs = require('fs');
const utilities = require('./utilities');
const analytics = require('./analytics');
const CONSTANTS = require('./constants');
const processor = require('./processor');
const DB = require('./db');
const config = require('./config.json');

const log = console.log;
let db = null;
const databaseFileName = `${config.target}/db.json`;
const statsFileName = 'stats.json';

function start(){
  log('************************************');
  log('database file name', databaseFileName);
  log('source directory: ', config.source);
  log('target directory: ', config.target);
  log('************************************\n');

  if(!fs.existsSync(config.source)){
    log(`${config.source} does not exist. Existing\n`);
    return;
  }

  if(!fs.existsSync(config.target)){
    log(`${config.target} does not exist. Existing\n`);
    return;
  }

  db = new DB(databaseFileName, (err, fileDataInDB) => {
    // 1. Get all files in the source directory
    recursive(config.source).then(allFiles => {
      // 2. Filter out files which are audio files
      const filteredFiles = utilities.fileFilter(allFiles, config, db);
      // filteredFiles.
      analytics.add(CONSTANTS.FILES_TO_PROCESS, filteredFiles.keep);
      analytics.add(CONSTANTS.FILES_TO_IGNORE, filteredFiles.ignore);
      if (filteredFiles.keep.length) {
        startProcessing(filteredFiles.keep, fileDataInDB.files);
      } else {
        log(`No files to process. Check ${config.source}`);
      }
    });
  });
}

/*
1. Get all files in the source directory
2. Filter out files which are audio files
3. Filter out files which have not changed between source and target
4. Process files which are new or changed
5. Remove from target those files which are not in source
 */

function getTargetPathsFor(genre, config, filePath) {
  //TODO: optimize, using cache
  if (Array.isArray(genre)) {
    genre = genre.join('/');
  }
  const splitters = [',', ';', '/'];
  let genres = [];
  for (let index = 0; index < splitters.length; index++) {
    const splitter = splitters[index];
    if (genre.indexOf(splitter) !== -1) {
      genres = genre.split(splitter);
      break;
    }
  }
  if (genres.length === 0) {
    genres.push(genre);
  }
  let mapSourceToTargets = {};
  mapSourceToTargets[filePath] = [];

  for (let index = 0; index < genres.length; index++) {
    const genre = genres[index].trim();
    if (config.genreToFolder[genre]) {
      const targetPaths = config.genreToFolder[genre].map((subFolder) =>
        `${config.target}/${subFolder}/${path.basename(filePath)}`);
      mapSourceToTargets[filePath] = mapSourceToTargets[filePath].concat(targetPaths);

    } else {
      const targetPath = `${config.target}/others/${genre}/${path.basename(filePath)}`;
      mapSourceToTargets[filePath] = mapSourceToTargets[filePath].concat(targetPath);
    }
  }
  return mapSourceToTargets;
}

function onfileDataExtracted(fileDataInDB, err, fileData, next) {
  if (!err) {
    const metadata = fileData.metadata || {};
    const filepath = fileData.filepath;
    if (metadata.genre.length === 0) {
      analytics.add(CONSTANTS.ANALYTICS_NO_GENRE, fileData, 'filepath');
    } else {
      const sourceTime = fileData.ctime;

      const targetTime = fileDataInDB[filepath]? fileDataInDB[filepath].ctime: null;

      // 3. Filter out files which have not changed between source and target
      if(sourceTime === targetTime){
        analytics.add(CONSTANTS.FILE_NO_CHANGE, fileData, 'filepath');
        next();
        return;
      }

      // 4. Process files which are new or changed
      const mapFilePathToTargets = getTargetPathsFor(metadata.genre, config, filepath);
      const targets = mapFilePathToTargets[filepath];
      const fileDataWithTargets = Object.assign({}, fileData, {targets});
     // for (let target of targets) {
     //    fsutils.copySync(filepath, target);
     // }

      if(!targetTime){
        analytics.add(CONSTANTS.FILE_NEW, fileDataWithTargets, 'filepath');
      }else{
        analytics.add(CONSTANTS.FILE_CHANGED, fileDataWithTargets, 'filepath');
      }
      /*targets && db.save(filepath, {metadata: {ctime: fileData.ctime}, targets: targets});
      db.persist();*/
    }
  } else {
    analytics(CONSTANTS.FILE_ERROR, err);
  }
  next();
}

function startProcessing(allFiles, fileDataInDB) {
  utilities.arrayIterate(allFiles, processor.process, onfileDataExtracted.bind(null, fileDataInDB), allDone.bind(null, allFiles, fileDataInDB));
}

function allDone(allFiles, fileDataInDB){
  // 5. Delete items from target which are not in source
  const filesToDeleteFromTarget = Object.keys(fileDataInDB).filter((fileInDB) => allFiles.indexOf(fileInDB) === -1);
  analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, filesToDeleteFromTarget);

  const stats = analytics.list();
  /*for(let key in stats){
    log();
    const value = stats[key];
    log(key, Object.keys(value).length);
    log(value);
  }*/

  jsonfile.writeFileSync(statsFileName, stats, {spaces: 2, EOL: '\r\n'});

  const newFiles = analytics.list(CONSTANTS.FILE_NEW);
  const changedFiles = analytics.list(CONSTANTS.FILE_CHANGED);

  const files = Object.assign({}, newFiles, changedFiles);

  const dbOutput = {files};

  // log('dbOutput', dbOutput);

  if(Object.keys(files).length) {
    // log('newFiles', newFiles);
    // log('changedFiles', changedFiles);

    // Handle, new, changed, deleted from source

    // delete from target
    // 1. find all those files which are in target but not in source
    // 2. delete them
    // 3. if the containing folder is empty, delete it

    // changed
    // 1. delete them from target
    // 2. copy from source to target

    // new
    // 1. copy new to target

    // jsonfile.writeFileSync(databaseFileName, dbOutput, {spaces: 2, EOL: '\r\n'});
  }else{
    log('no change');
  }
}
// Check type of each key
// Before deleting, think if the file to be deleted are in target.
// For updated files, delete the files and then copy new

start();
