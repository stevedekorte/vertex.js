AddonLoader = Proto.clone().newSlots({
	protoType: "AddonLoader",
	searchPaths: [__dirname.appendPathComponent("../../addons")]
}).setSlots({
	loadAddons: function()
	{
		this.searchPaths().forEach(function(path)
		{
			Directory.clone().setPath(path).directories().forEach(function(dir)
			{
				require(dir.path().appendPathComponent(dir.name()));
			});
		});
	}
});