AddonLoader = Proto.clone().newSlots({
	protoType: "AddonLoader",
	searchPaths: [__dirname.appendPathComponent("../../addons")]
}).setSlots({
	loadAddons: function()
	{
		this.searchPaths().forEach(function(path)
		{
			var d = Directory.clone().setPath(path);
			
			if(d.exists())
			{
				d.directories().forEach(function(dir)
				{
					require(dir.path().appendPathComponent(dir.name()));
				});
			}
		});
	}
});