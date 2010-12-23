var path = require("path");
var fs = require("fs");

File = Proto.clone().newSlots({
	path: null,
	fd: null,
	error: null,
	isOpen: false,
	encoding: "utf8"
}).setSlots({
	open: function(flags)
	{
		return this.openForReading();
	},
	
	openWithFlags: function(flags)
	{
		if(!this.isOpen())
		{
			this.setFd(fs.openSync(this.path(), flags));
		}
		
		return this;
	},
	
	openForReading: function()
	{
		return this.openWithFlags("r");
	},
	
	openForWriting: function()
	{
		return this.openWithFlags("w");
	},
	
	openForAppending: function()
	{
		return this.openWithFlags("a");
	},
	
	close: function()
	{
		fs.closeSync(this.fd());
		this.setFd(null);
		return this;
	},
	
	write: function(str)
	{
		fs.writeSync(this.fd(), str, null, this.encoding());
	},
	
	writeln: function()
	{
		this.write(Arguments_asArray(arguments).join("") + "\n");
	},
	
	exists: function()
	{
		try
		{
			fs.statSync(this.path());
			return true;
		}
		catch(e)
		{
			if(e.message.beginsWith("ENOENT"))
			{
				return false;
			}
			else
			{
				throw e;
			}
		}
	},
	
	createIfAbsent: function()
	{
		if(!this.exists())
		{
			if(this.isOpen())
			{
				throw new Error("createIfAbsent before opening open file");
			}
			else
			{
				this.openForWriting().close();
			}
		}
		return this;
	},
	
	contents: function()
	{
		return fs.readFileSync(this.path().toString(), this.encoding());
	},
	
	setContents: function(aString)
	{
		fs.writeFileSync(this.path(), aString, this.encoding());
		return this;
	},
	
	name: function()
	{
		return path.basename(this.path());
	},
	
	baseName: function()
	{
		return this.name().beforeLast(".");
	},
	
	remove: function()
	{
		if(this.exists())
		{
			fs.unlinkSync(this.path());
		}
		return this
	},
	
	lines: function()
	{
		return this.contents().split("\n");
	},
	
	copyToPath: function(path)
	{
		File.clone().setPath(path).setContents(this.contents());
		return this;
	}
});