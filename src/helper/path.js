const getDbFileName = config => `${config.source}/db.json`;
const getTargetDbFileName = config => `${config.target}/db.json`;
const getStatsFileName = (config) => 'stats.json';
const getUpdateFlagFileName = (config) => 'update';
const getToUpdateFileName = (config) => 'toupdate.json';
const getToDeleteFileName = (config) => 'todelete.json';

module.exports = {getDbFileName, getUpdateFlagFileName, getTargetDbFileName, getStatsFileName, getToUpdateFileName, getToDeleteFileName};
