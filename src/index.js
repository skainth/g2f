"use strict";
const path = require('path');
const recursive = require('recursive-readdir');
const fs = require('fs-extra');
const _ = require('lodash');
const utilities = require('./helper/utilities');
const paths = require('./helper/path');
const analytics = require('./analytics');
const CONSTANTS = require('./constants');
const processor = require('./processor');
const config = require('./config.json');
const Logger = require('./helper/logger');

const logFile = paths.getLogFileName(config);
const log = new Logger({logFile}).log;

function start(){
  const databaseFileName = paths.getDbFileName(config);

	log();
  log('***** Processing  Source ***********');
  log('database file name', databaseFileName);
  log('source directory: ', config.source);
  log('target directory: ', config.target);
  log('************************************');

  if(_.isEmpty(config.source) || !fs.existsSync(config.source)){
    log('source directory does not exist. Existing');
    return;
  }

  if(_.isEmpty(config.target)){
    log('target directory not specified. Existing');
    return;
  }

  let fileDataInDB =  null;
  if(!fs.existsSync(databaseFileName)){
		const emptyDb = {files: {}};
		fileDataInDB = emptyDb;
		utilities.writeJSONToFile(fileDataInDB, databaseFileName);
  }else{
    fileDataInDB = fs.readJsonSync(databaseFileName);
  }

  // 1. Get all files in the source directory
  recursive(config.source).then(allFiles => {
    // 2. Filter out files which are audio files
    const filteredFiles = utilities.fileFilter(allFiles, config);
    // filteredFiles.
    analytics.add(CONSTANTS.FILES_TO_PROCESS, filteredFiles.keep);
    analytics.add(CONSTANTS.FILES_TO_IGNORE, filteredFiles.ignore);
    if (filteredFiles.keep.length) {
      startProcessing(filteredFiles.keep, fileDataInDB.files);
    } else {
      log(`No files to process. Check ${config.source}`);
    }
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
        path.join(config.target, subFolder, path.basename(filePath)));
      mapSourceToTargets[filePath] = mapSourceToTargets[filePath].concat(targetPaths);

    } else {
      const defaultFolder = config.genreToFolder['Others'] || 'others';
      const targetPath = path.join(config.target, defaultFolder, genre, path.basename(filePath));
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

      if(!targetTime){
        analytics.add(CONSTANTS.FILE_NEW, fileDataWithTargets, 'filepath');
      }else{
        analytics.add(CONSTANTS.FILE_CHANGED, fileDataWithTargets, 'filepath');
      }
    }
  } else {
    log('ERROR', fileData, err.message);
    analytics.add(CONSTANTS.FILE_ERROR, fileData.filepath + ' ' + err.message);
  }
  next();
}

function startProcessing(allFiles, fileDataInDB) {
  utilities.arrayIterate(allFiles, processor.process, onfileDataExtracted.bind(null, fileDataInDB), allDone.bind(null, allFiles, fileDataInDB));
}

function allDone(allFiles, fileDataInDB){
	const statsFileName = paths.getStatsFileName(config);
  const filesToDeleteFromTarget = Object.keys(fileDataInDB).filter((fileInDB) => allFiles.indexOf(fileInDB) === -1);
  analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, filesToDeleteFromTarget);

  const stats = analytics.list();

  utilities.writeJSONToFile(stats, statsFileName);
	log('processing done');
}

start();
