var sys = require('sys');
var spawn = require('child_process').spawn;
require("../lib/lib");

VertexProcess = Proto.clone().newSlots({
	protoType: "VertexProcess",
	exePath: '../../server.js',
	port: '8123',
	dbPath: 'test.db',
	delegate: null,
	silent: false,
	child: null
}).setSlots({
	launch: function()
	{
		//writeln("VertexProcess launch()")
		var self = this;
		
		var args = [
			this.exePath(), 
			'-port', new String(this.port()), 
			'-db', this.dbPath()];
			
		//writeln("node ", args.join(" "))
		this._child = spawn('node', args);
			
		//this._child.addListener('data', function (data) { });
		//if(this._silent) 
		//{ 
			this._child.stdout.addListener('data', function (data) {}); 
		//} 
		//else
		//{ 
			//this._child.stdout.addListener('data', function (data) { sys.puts(data); }); 
		//} 
		
		//if(this._silent) 
		//{ 
			//vdb.stderr.addListener('data', function (data) {}); 
		//}
		//else
		//{ 
			this._child.stderr.addListener('data', function (data) { sys.puts(data); }); 
		//} 
	
		this._child.addListener('exit', function (code) { self.didExit(); });
		
		this._timeoutId = setTimeout(function () { self.didStart(); }, 1000); // hack - need to check for ready output
		return this;
	},
	
	
	didStart: function()
	{
		clearTimeout(this._timeoutId)
		if (this.delegate())
		{
			this.delegate().didStart(this);
		}		
	},
	
	didExit: function()
	{
		if (this.delegate())
		{
			this.delegate().didExit(this);
		}		
	},
	
	kill: function()
	{
		//writeln("VertexProcess kill")
		this._child.kill()
	}
});

