var sys = require('sys'), spawn = require('child_process').spawn;
require("../lib/Crux/Crux");

VertexProcess = Proto.newSlots({
	protoType: "VertexProcess",
	exePath: '../server.js',
	port: '8123',
	dbPath: 'test.db',
	delegate: null,
	silent: false
}).setSlots({
	launch: function()
	{
		writeln("VertexProcess launch()")
		var self = this;
		
		var args = [
			this.exePath(), 
			'-port', this.port(), 
			'-db', this.dbPath()];
			
		writeln("node ", args.join(" "))
		vdb = spawn('node', args);
			
		vdb.addListener('data', function (data) { });
		//if(this._silent) 
		//{ 
			vdb.stdout.addListener('data', function (data) {}); 
		//} 
		//else
		//{ 
		//	vdb.stdout.addListener('data', function (data) { sys.puts(data); }); 
		//} 
		
		//if(this._silent) 
		//{ vdb.stderr.addListener('data', function (data) {}); }
		//else
		//{ 
			vdb.stderr.addListener('data', function (data) { sys.puts(data); }); 
		//} 
	
		vdb.addListener('exit', function (code) { self.didStart(); });
		
		writeln("setTimeout()")
		this._timeoutId = setTimeout(function () { self.didStart(); }, 1000); // hack - need to check for ready output
	},
	
	didExit: function()
	{
		if (this.delegate())
		{
			this.delegate().didExit(this);
		}		
	},
	
	didStart: function()
	{
		clearTimeout(this._timeoutId)
		if (this.delegate())
		{
			this.delegate().didStart(this);
		}		
	}
});

