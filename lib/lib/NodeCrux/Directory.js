var fs = require("fs");

Directory = Proto.clone().newSlots({
	path: null
}).setSlots({
	files: function()
	{
		return this.paths().filter(function(path)
		{
			return fs.statSync(path).isFile();
		}).map(function(path)
		{
			return File.clone().setPath(path);
		});
	},
	
	directories: function()
	{
		return this.paths().filter(function(path)
		{
			return ![".", ".."].contains(path.lastPathComponent()) && fs.statSync(path).isDirectory();
		}).map(function(path)
		{
			return Directory.clone().setPath(path);
		});
	},
	
	name: function()
	{
		return this.path().lastPathComponent();
	},
	
	names: function()
	{
		return fs.readdirSync(this.path());
	},
	
	paths: function()
	{
		return this.names().mapPerform("prepend", this.path() + "/");
	},
	
	fileNamed: function(name)
	{
		return File.clone().setPath(this.path().appendPathComponent(name));
	},
	
	dirNamed: function(name)
	{
		return Directory.clone().setPath(this.path().appendPathComponent(name));
	},
	
	exists: function()
	{
		return File.clone().setPath(this.path()).exists();
	},
	
	requireFiles: function()
	{
		this.files().forEach(function(file){
			if(file.path().endsWith(".js"))
			{
				require(file.path());
			}
		});
		
		return this;
	}
});