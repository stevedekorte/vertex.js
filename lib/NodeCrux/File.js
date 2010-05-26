var path = require("path");
var fs = require("fs");

File = Proto.clone().newSlots({
	path: null,
	fd: null,
	error: null,
	isOpen: false,
	encoding: "utf8"
}).setSlots({
	open: function()
	{
		if(!this.isOpen())
		{
			this.setFd(fs.openSync(this.path()));
		}
		
		return this;
	},
	
	close: function()
	{
		fs.closeSync(this.fd());
		this.setFd(null);
		return this;
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
				this.close().open();
			}
			else
			{
				this.open().close();
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