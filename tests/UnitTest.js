var sys = require('sys'),
http = require('http'),
path = require("path");

require("../lib/Crux/Crux");
require("../lib/NodeCrux/NodeCrux");
require("../lib/Vertex/Vertex");

UnitTest = Proto.clone().newSlots({
	protoType: "UnitTest",
}).setSlots({
	run: function()
	{
		writeln(this.protoType(), " test:")
		var names = this.proto().slotNames()
		for (i = 0; i < names.length; i ++)
		{
			var name = names[i]
			if(name.beginsWith("test"))
			{
				writeln("  ", name)
				this[name].call(this)
				writeln("    OK")
			}
		}
		writeln("  ALL TESTS PASSED")
	},

	runSilnet: function()
	{
		writeln(this.protoType(), " test:")
		var names = this.proto().slotNames()
		for (i = 0; i < names.length; i ++)
		{
			var name = names[i]
			if(name.beginsWith("test"))
			{
				//writeln("  ", name)
				this[name].call(this)
				//writeln("    OK")
			}
		}
		//writeln("  ALL TESTS PASSED")
	},
})
