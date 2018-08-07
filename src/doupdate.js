const fs = require('fs-extra');
const config = require('./config');
const util = require('./utilities');
const paths = require('./helper/path');
const log = console.log;

const dbFileName = paths.getDbFileName(config);
const statsFileName = paths.getStatsFileName(config);
const dbTargetFileName = paths.getTargetDbFileName(config);
const toDeleteFileName = paths.getToDeleteFileName(config);
const toUpdateFileName = paths.getToUpdateFileName(config);
const updateFlagFileName = paths.getUpdateFlagFileName(config);

const database = fs.readJSONSync(dbFileName);

const db = database.files;
// Delete files
if(fs.existsSync(toDeleteFileName)){
  const jsonToDel = fs.readJSONSync(toDeleteFileName);
  for(let source in jsonToDel){
    const {targets = []} = jsonToDel[source];
    delete db[source];
    targets.forEach( target => {
      if(fs.existsSync(target)){
        // log(target);
        fs.removeSync(target);
        // Check if empty folder
        // check if parent folder is empty. recurse till config.target
      }
    });
  }
}else{
  log(`${toDeleteFileName} does not exist`);
}

// Add files
if(fs.existsSync(toUpdateFileName)){
  const jsonToUpdate = fs.readJSONSync(toUpdateFileName);
  for(let source in jsonToUpdate){
    const {targets = []} = jsonToUpdate[source];
    db[source] = jsonToUpdate[source];
    targets.forEach( target => {
      // log(target);
      fs.ensureFileSync(target);
      fs.copySync(source, target);
    });
  }
}else{
  log(`${toUpdateFileName} not found`);
}

const newDB = {files: db};
util.writeJSONToFile(newDB, dbFileName);
util.writeJSONToFile(newDB, dbTargetFileName);

fs.removeSync(statsFileName);
fs.removeSync(toDeleteFileName);
fs.removeSync(toUpdateFileName);
fs.removeSync(updateFlagFileName);

log('update complete');

// why update available message showing up?
