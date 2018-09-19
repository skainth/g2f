const path = require('path');

const getFilePath = fileName => path.format({root: '.', dir: 'data', base: fileName});

const getDbFileName = () => getFilePath('db.json');
const getTargetDbFileName = config => path.format({dir: config.target, base: 'db.json'});
const getStatsFileName = () => getFilePath('stats.json');
const getUpdateFlagFileName = () => getFilePath('update');
const getToUpdateFileName = () => getFilePath('toupdate.json');
const getToDeleteFileName = () => getFilePath('todelete.json');
const getLogFileName = () => getFilePath('log.txt');

module.exports = {getDbFileName, getUpdateFlagFileName, getTargetDbFileName, getStatsFileName, getToUpdateFileName, getToDeleteFileName, getLogFileName};
