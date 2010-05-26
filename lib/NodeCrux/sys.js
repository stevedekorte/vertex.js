var sys = require("sys");

writeln = function()
{
	sys.puts(Arguments_asArray(arguments).join(""));
}

inspect = function(obj)
{
	sys.puts(sys.inspect(obj));
}