var path = require("path");

Object_shallowCopyFrom_(String.prototype, {
	fileExtension: function()
	{
		return path.extname(this).after(".");
	},
	
	lastPathComponent: function()
	{
		return path.basename(this);
	},
	
	pathComponent: function()
	{
		var pc = path.dirname(this);
		if(pc == ".")
		{
			pc = "/";
		}
		return pc;
	},
	
	appendPathComponent: function(pc)
	{
		return [this, pc].asPath();
	},
	
	appendPC: function(pc)
	{
		return this.appendPathComponent(pc);
	}
});