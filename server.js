require("./lib/Crux/Crux");
require("./lib/NodeCrux/NodeCrux");
require("./lib/Vertex/Vertex");

var vertex = Vertex.init()

var sys = require('sys');
var args = process.argv;
args.shift();
args.shift();

var option; 
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
	else
	{
		sys.puts("Unknown option '" + option + "'")
		process.exit()
	}
}

vertex.start();