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
	var value = args.shift();
	
	//writeln(option, ":", value);
	
	if(option == "-db")
	{
		vertex.setPath(value);
	} 
	else if (option == "-port")
	{
		vertex.setPort(new Number(value));
	} 
	else if (option == "-test")
	{
		//process.chdir("./tests")
		testProcess = spawn('./runtests.sh', []);
		testProcess.stdout.addListener('data', function (data) { sys.puts(data); });
		testProcess.stderr.addListener('data', function (data) { sys.puts(data); });
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