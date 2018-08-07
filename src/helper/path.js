const getDbFileName = config => `${config.source}/db.json`;
const getStatsFileName = (config) => 'stats.json';
const getToUpdateFileName = (config) => 'toupdate.json';
const getToDeleteFileName = (config) => 'todelete.json';

module.exports = {getDbFileName, getStatsFileName, getToUpdateFileName, getToDeleteFileName};
