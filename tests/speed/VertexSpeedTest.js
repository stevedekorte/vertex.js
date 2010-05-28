require("../../lib/lib");
require("../VertexProcess");
require("./AbProcess");

VertexSpeedTest = Proto.clone().newSlots({
	protoType: "VertexSpeedTest",
	vertexProcess: VertexProcess.clone(),
	abProcess: AbProcess.clone()
}).setSlots({
	run: function()
	{
		this.vertexProcess().setDelegate(this).launch();
	},
	
	didStart: function(proc)
	{
		//writeln("VertexPerfTest didStart(", proc.protoType(), ")")
		if(proc == this.vertexProcess())
		{
			this.abProcess().setDelegate(this).launch();
		}
	},
	
	didExit: function(proc)
	{
		//writeln("VertexPerfTest didExit(", proc.protoType(), ")")
		if(proc == this.abProcess())
		{
			this.vertexProcess().kill();
			writeln("VertexPerformance test:")
			writeln("  ", this.abProcess().requestsPerSecond(), " requests per second");
		}
	}	
}).run();