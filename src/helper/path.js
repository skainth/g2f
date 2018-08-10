const path = require('path');

const getDbFileName = config => path.format({dir: config.source, base: 'db.json'});
const getTargetDbFileName = config => path.format({dir: config.target, base: 'db.json'});
const getStatsFileName = (config) => 'stats.json';
const getUpdateFlagFileName = (config) => 'update';
const getToUpdateFileName = (config) => 'toupdate.json';
const getToDeleteFileName = (config) => 'todelete.json';

module.exports = {getDbFileName, getUpdateFlagFileName, getTargetDbFileName, getStatsFileName, getToUpdateFileName, getToDeleteFileName};
