var sys = require('sys'), spawn = require('child_process').spawn;

String.prototype.before = function(aString)
{
	var index = this.indexOf(aString);
	if(index == -1) return this;
	return this.slice(0, index); 
}

String.prototype.after = function(aString)
{
	var index = this.indexOf(aString);
	if(index == -1) return null;
	return this.slice(index + aString.length);
}

String.prototype.trim = function(aString)
{
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
	
function startAb()
{
	var ab = spawn('ab', ['-n', '2000', '-c', '10', '-T', 'application/json-request', '-p', 'data.txt', 'http://127.0.0.1:8123/']);
	//var ab = spawn('ab', ['http://127.0.0.1:8123/']);
	var abOutput = ""
	ab.stdout.addListener('data', function (data) { abOutput = abOutput + data });
	ab.stderr.addListener('data', function (data) {});

	ab.addListener('exit', function (code) { 
		//sys.debug('ab exited');
		//sys.debug("requests per second: " + abOutput.after("Requests per second:").before("[") + "'")
		var rps = abOutput.after("Requests per second:").before("[").trim()
		sys.puts("requests per second: " + rps);
		vdb.kill();
	});
}


function startVdb()
{
	vdb = spawn('node', ['../server.js', '-port', '8123', '-db', 'test.db']);
	//vdb.stdout.addListener('data', function (data) { sys.print('stdout: ' + data); });
	vdb.addListener('data', function (data) { });
	vdb.stdout.addListener('data', function (data) {});
	vdb.stderr.addListener('data', function (data) {});
	vdb.addListener('exit', function (code) { 
		//sys.debug('vdb exited');
	});
}

startVdb();
setTimeout(function () { startAb(); } , 1000)
