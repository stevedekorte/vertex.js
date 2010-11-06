AddonLoader = Proto.clone().newSlots({
	protoType: "AddonLoader",
	searchPaths: [__dirname.appendPathComponent("../../addons")]
}).setSlots({
	loadAddons: function()
	{
		//writeln("AddonLoader loadAddons");
		var addons = [];
		this.searchPaths().forEach(
			function(path)
			{
				var d = Directory.clone().setPath(path);
			
				if(d.exists())
				{
					d.directories().forEach(
						function(dir)
						{
							//writeln("dir.name() = ", dir.name());
							var addonModule = require(dir.path().appendPathComponent(dir.name()));
							var addon = addonModule[dir.name()];
							addons.push(addon);
						}
					);
				}
			}
		);
		return addons;
	}
});