const fs = require('fs-extra');
let file = null;
function Logger({logFile = ''}){
	console.log(`log to ${logFile}`);
	if(logFile) {
		file = logFile;
		fs.ensureFileSync(logFile);
	}else{
		console.error('log file not given');
	}
}
Logger.prototype.log = function (...restArgs){
	const d = new Date();

	const timeAsStr = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} ${d.getDate()}/${d.getFullYear()}`;
	let output = restArgs.reduce((acc, arg) => `${acc} ${JSON.parse(JSON.stringify(arg))}`, '');
	output = (output? `${timeAsStr} - ${output}`: '') + '\n';
	console.log(output);
	file && fs.outputFileSync(file, output, {flag: 'a'});
};

module.exports = Logger;
