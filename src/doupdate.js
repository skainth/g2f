const fs = require('fs-extra');
const config = require('./config');
const paths = require('./helper/path');
const log = console.log;

const toDeleteFileName = paths.getToDeleteFileName(config);
const toUpdateFileName = paths.getToUpdateFileName(config);

if(fs.existsSync(toDeleteFileName)){
  const jsonToDel = fs.readJSONSync(toDeleteFileName);
  for(let source in jsonToDel){
    const {targets = []} = jsonToDel[source];
    log(source);targets.forEach( target => {
      if(fs.existsSync(target)){
        log(target);
        fs.removeSync(target);
        // Check if empty folder
        // check if parent folder is empty. recurse till config.target
      }
    });
  }
}else{
  log(`${toDeleteFileName} does not exist`);
}

if(fs.existsSync(toUpdateFileName)){
  const jsonToUpdate = fs.readJSONSync(toUpdateFileName);
  for(let source in jsonToUpdate){
    const {targets = []} = jsonToUpdate[source];
    log('\n', source);
    targets.forEach( target => {
      log(target);
      fs.ensureFileSync(target);
      fs.copySync(source, target);
    });
  }
}else{
  log(`${toUpdateFileName} not found`);
}

// Remove todel.json
// Remove toupdate.json
// update db.json
// copy db.json to target
// remove update flag file
