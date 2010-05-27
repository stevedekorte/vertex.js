require("../lib/Crux/Crux");
require("../lib/NodeCrux/NodeCrux");
require("../lib/Vertex/Vertex");

require("./VertexProcess");
require("./AbProcess");

writeln("VertexProcess ", VertexProcess.protoType())
writeln("AbProcess ", AbProcess.protoType())

process.exit()

VertexPerfTest = Proto.clone().newSlots({
	vertexProcess: VertexProcess.clone(),
	abProcess: AbProcess.clone()
}).setSlots({
	run: function()
	{
		this.vertexProcess().setDelegate(this).launch();
	},
	
	didStart: function(proc)
	{
		writeln("VertexPerfTest didStart(", proc.protoType(), ")")
		if(proc == this.vertexProcess())
		{
			var ab = AbProcess.clone()
			writeln("starting abrocess ", ab.protoType())
			ab.setDelegate(this).launch();
		}
	},
	
	didExit: function(proc)
	{
		writeln("VertexPerfTest didExit ", proc.protoType(), ")")
		if(proc == this.abProcess())
		{
			this.vertexProcess().kill();
		}
		
		writeln("rps: ", this.abProcess().requestsPerSecond());
	}	
}).run();