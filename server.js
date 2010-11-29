require("./lib/lib");
var vertex = Vertex.init()

var sys = require('sys');
var spawn = require('child_process').spawn;
var args = process.argv;
args.shift();
args.shift();

var option;
var testProcess = null;

while (option = args.shift())
{	
	//writeln(option, ":", value);
	
	if(option == "-v")
	{
		vertex.setVerbose(true);
	}
	else if(option == "-db")
	{
		vertex.setPath(args.shift());
	} 
	else if (option == "-port")
	{
		vertex.setPort(new Number(args.shift()));
	} 
	else if (option == "-test")
	{
		//process.chdir("./tests")
		testProcess = spawn('./runtests.sh', []);
		testProcess.stdout.addListener('data', function (data) { sys.puts(data); });
		testProcess.stderr.addListener('data', function (data) { sys.puts(data); });
	}
	else if (option == "-help")
	{
		writeln("SYNOPSIS")
		writeln("    node server.js -db path -port port")
		writeln("")
		writeln("DESCRIPTION")
		writeln("     vertex.js is a graph database server inspired by filesystems. See docs for API info.")
		writeln("")
		writeln("    -db path")
		writeln("          Set the path to the database file. Default is db/vertex.vdb.")
		writeln("")
		writeln("    -port port")
		writeln("          Set the port the server should run on. Default is 8000.")
		writeln("")
		process.exit()
	}
	else
	{
		sys.puts("Unknown option '" + option + "'")
		process.exit()
	}
}

if(testProcess == null)
{
	vertex.start();
}

process.on("SIGINT", function(){
	writeln("received SIGINT");
	process.exit();
});