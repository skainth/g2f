"use strict";
const path = require('path');
const recursive = require('recursive-readdir');
const fs = require('fs-extra');
const utilities = require('./utilities');
const analytics = require('./analytics');
const CONSTANTS = require('./constants');
const processor = require('./processor');
const DB = require('./db');
const config = require('./config.json');

const log = console.log;

const databaseFileName = `${config.target}/db.json`;

log('database file name', databaseFileName);
log('source directory', config.source);
log('target directory', config.target);

/*
1. Get all files in the source directory
2. Filter out files which are audio files
3. Filter out files which have not changed between source and target
4. Process files which are new or changed
5. Remove from target those files which are not in source
 */

const db = new DB(databaseFileName, (err, fileDataInDB) => {
  // 1. Get all files in the source directory
  recursive(config.source).then(allFiles => {
  // 2. Filter out files which are audio files
    const filteredFiles = utilities.fileFilter(allFiles, config, db);
    analytics.add(CONSTANTS.FILES_TO_PROCESS, filteredFiles.keep);
    analytics.add(CONSTANTS.FILES_TO_IGNORE, filteredFiles.ignore);
    if (filteredFiles.keep.length) {
      startProcessing(filteredFiles.keep, fileDataInDB);
    } else {
      log(`No files to process. Check ${config.source}`);
    }
  });
});

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
    if (!metadata.genre) {
      analytics.add(CONSTANTS.ANALYTICS_NO_GENRE, filepath);
    } else {
      const sourceTime = fileData.ctime;
      const targetTime = fileDataInDB[filepath]? fileDataInDB[filepath].metadata.ctime: null;

      // 3. Filter out files which have not changed between source and target
      if(sourceTime === targetTime){
        analytics.add(CONSTANTS.FILE_NO_CHANGE, filepath);
        next();
        return;
      }else{
        // 4. Process files which are new or changed
        if(!targetTime){
          analytics.add(CONSTANTS.FILE_NEW, filepath);
        }else{
          analytics.add(CONSTANTS.FILE_CHANGED, filepath);
        }
      }
      const mapFilePathToTargets = getTargetPathsFor(metadata.genre, config, filepath);
      const targets = mapFilePathToTargets[filepath];
      for (let target of targets) {
        fs.copySync(filepath, target);
      }

      targets && db.save(filepath, {metadata: {ctime: fileData.ctime}, targets: targets});
      db.persist();
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

  const logs = analytics.list();
  for(let index in logs){
    log();
    log(index);
    log(logs[index]);
  }
}
