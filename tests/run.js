/*
var sys = require('sys');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

var files = ['./correctness', '../speed'];

function nextFile()
{		
	var file = files.shift();
	if(file == null) return;
	sys.puts("file: " + file)
	var dir = path.dirname(file);
	sys.puts("dir = " + dir)
	process.chdir(dir)
	var proc = spawn('node', ["run.js"]);

	proc.stdout.addListener('data', function (data) { sys.print(data + "."); });
	proc.stderr.addListener('data', function (d) { sys.print(d); });
	proc.addListener('exit', function (code) { nextFile(); });
}

nextFile();
*/