var sys = require('sys');
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

require('../UnitTest');
require("../../lib/lib");

var files = ['./PDBTest.js', './VertexBaseTest.js', './VertexTest.js', './VertexPermissionsTest.js'];

function nextFile()
{
	try
	{
		fs.unlinkSync('test.db');
		fs.unlinkSync('test.db.wal');
	}
	catch (e)
	{
	}
		
	var file = files.shift();
	if(file == null) return;
	var proc = spawn('node', [file]);
	proc.stdout.addListener('data', function (data) { sys.print(data); });
	proc.stderr.addListener('data', function (data) { sys.print(data); });
	proc.addListener('exit', function (code) { nextFile(); });
}

nextFile();