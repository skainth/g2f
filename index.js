"use strict";
const path = require('path');
const recursive = require('recursive-readdir');
const fs = require('fs-extra');
const utilities = require('./utilities');
const analytics = require('./analytics');
const CONSTANTS = require('./constants');
const processor = require('./processor');
const config = require('./config.json');

const log = console.log;

function getTargetPathsFor(genre, config, filePath){
    //TODO: optimize, using cache
    if(Array.isArray(genre)){
        genre = genre.join('/');
    }
    const splitters = [',', ';', '/'];
    let genres = [];
    for(let index = 0; index < splitters.length; index ++){
        const splitter = splitters[index];
        if(genre.indexOf(splitter) !== -1){
            genres = genre.split(splitter);
            break;
        }
    }
    if(genres.length === 0){
        genres.push(genre);
    }
    let mapSourceToTargets = {};
    mapSourceToTargets[filePath] = [];

    for(let index = 0; index < genres.length; index ++){
        const genre = genres[index].trim();
        if(config.genreToFolder[genre]){
            const targetPaths = config.genreToFolder[genre].map((subFolder) =>
                `${config.target}/${subFolder}/${path.basename(filePath)}`);
            mapSourceToTargets[filePath] = mapSourceToTargets[filePath].concat(targetPaths);

        }else{
            const targetPath = `${config.target}/others/${genre}/${path.basename(filePath)}`;
            mapSourceToTargets[filePath] = mapSourceToTargets[filePath].concat(targetPath);
        }
    }
    return mapSourceToTargets;
}

function onDataExtracted(err, data, next){
    if(!err) {
        const metadata = data.metadata || {};
        const filepath = data.filepath;
        if(!metadata.genre){
            analytics.add(CONSTANTS.ANALYTICS_NO_GENRE, filepath);
        }else{
            const mapFilePathToTargets = getTargetPathsFor(metadata.genre, config, filepath);
            const targets = mapFilePathToTargets[filepath];
            for(let target of targets){
                fs.copySync(filepath, target);
            }
        }
    }else{
        analytics(CONSTANTS.FILE_ERROR, err);
    }
    next();
}

function startProcessing(allFiles){
    utilities.arrayIterate(allFiles, processor.process, onDataExtracted, ()=> log('all done', analytics.list()));
}

recursive(config.source).then(allFiles => {
    const filteredFiles = utilities.fileFilter(allFiles, config);
    if(filteredFiles.length){
        startProcessing(filteredFiles, 0);
    }else{
        log(`No files to process. Check ${config.source}`);
    }
});
