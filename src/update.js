const _ = require('lodash');
const fs = require('fs-extra');
const config = require('./config');
const CONSTANTS = require('./constants');
const analytics = require('./analytics');
const paths = require('./helper/path');
const utils = require('./helper/utilities');

const Logger = require('./helper/logger');

const logFile = paths.getLogFileName(config);
const log = new Logger({logFile}).log;

const statsFileName = paths.getStatsFileName(config);
const dbFileName = paths.getDbFileName(config);
const toUpdateFileName = paths.getToUpdateFileName(config);
const toDeleteFileName = paths.getToDeleteFileName(config);
const updateAvailableFileName = paths.getUpdateFlagFileName(config);

const db = fs.readJSONSync(dbFileName);
const stats = fs.readJSONSync(statsFileName);

const dbFiles = db.files;

// find all those files which are in target but not in source
for(let filepath in dbFiles){
	const dbFile = dbFiles[filepath];
	if(!stats[CONSTANTS.FILES_TO_PROCESS][filepath]){
		analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, dbFile, 'filepath');
	}
}

// changed files
const changedFiles = stats[CONSTANTS.FILE_CHANGED];

if(utils.objectLength(changedFiles)){
	for(let filepath in changedFiles){
		const changedFile = changedFiles[filepath] || {};
		analytics.add(CONSTANTS.FILE_TO_DELETE_FROM_TARGET, changedFile, 'filepath');
		analytics.add(CONSTANTS.FILE_CHANGED, changedFile, 'filepath');
	}
}else{
	log('no changed files');
}

// New files
const newFiles = stats[CONSTANTS.FILE_NEW];

if(utils.objectLength(newFiles)){
	for(let filepath in newFiles){
		const newFile = newFiles[filepath] || {};

		analytics.add(CONSTANTS.FILE_NEW, newFile, 'filepath');
	}
}else{
	log('no new files');
}

const filesToDelete = analytics.list(CONSTANTS.FILE_TO_DELETE_FROM_TARGET);
const filesToCopy = Object.assign({}, analytics.list(CONSTANTS.FILE_CHANGED), analytics.list(CONSTANTS.FILE_NEW));

utils.writeJSONToFile(filesToCopy, toUpdateFileName);
utils.writeJSONToFile(filesToDelete, toDeleteFileName);

if(!_.isEmpty(Object.assign({}, filesToCopy, filesToDelete))){
	const countToUpdate = utils.objectLength(filesToCopy);
	const countToDelete = utils.objectLength(filesToDelete);
	const countChangedFiles = utils.objectLength(changedFiles);
	const countNewFiles = utils.objectLength(newFiles);
	const countNoGenre = utils.objectLength(stats[CONSTANTS.ANALYTICS_NO_GENRE]);
	const countError = utils.objectLength(stats[CONSTANTS.FILE_ERROR]);
	const output = `New ${countNewFiles}, changed ${countChangedFiles}, to update ${countToUpdate}, to delete ${countToDelete}, no genre ${countNoGenre}, error in ${countError}`;
	log(`UPDATE AVAILABLE ${output}`);
	if(!fs.exists(updateAvailableFileName)) {
		fs.ensureFileSync(updateAvailableFileName);
	}
	fs.outputFileSync(updateAvailableFileName, output);
}

// After deleting file from target, check if the containing folder is empty
