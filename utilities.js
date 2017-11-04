"use strict";

module.exports = {
    // Filter out files based upon extensions
    fileFilter: (allFiles, config) => {
        return (allFiles.filter(fileName => {
            const dotAt = fileName.lastIndexOf('.');
            if(dotAt !== -1) {
                const extension = fileName.substr(dotAt + 1);
                return (config.allowedExtentions.indexOf(extension.toLowerCase()) !== -1)
            }else{
                return false;
            }
        }));
    },
    arrayIterate: (array, processingFn, callback, done) => {
        let index = 0;
        function next(){
            if(index + 1 === array.length){
                done();
            }else{
                processingFn(array[++ index], internalFn);
            }
        }
        function internalFn(){
            const argsArray = Array.from(arguments);
            argsArray.push(next);
            callback.apply(null, argsArray);
        }
        processingFn(array[index], internalFn);
    }
};