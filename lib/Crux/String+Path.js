Object_shallowCopyFrom_(String.prototype,{
	pathComponents: function()
	{
		if(this == "/")
		{
			return [""];
		}
		else
		{
			return this.split("/");
		}
	},
	
	appendPathComponent: function(pc)
	{
		if(pc && pc.strip() != "")
		{
			if(this.endsWith("/"))
			{
				return this + pc;
			}
			else
			{
				return [this, pc].join("/");
			}
		}
		else
		{
			return this;
		}
	},

	sansLastPathComponent: function()
	{
		var components = this.pathComponents();
		components.pop();
		return components.join("/");
	},
	
	lastPathComponent: function()
	{
		return this.pathComponents().last();
	},
	
	pathComponent: function()
	{
		var pc = this.pathComponents().slice(0, -1).join("/");
		if(pc == "")
		{
			pc = "/";
		}
		
		return pc;
	},
	
	pathPermutations: function()
	{
		var pcs = this.pathComponents();
		return pcs.map(function(pc, i){
			if(i == 0)
			{
				return "/";
			}
			else
			{
				return pcs.slice(0, i + 1).asPath();
			}
		});
	},
	
	fileExtension: function()
	{
		return this.lastPathComponent().after(".");
	},
	
	appendPC: function(pc)
	{
		return this.appendPathComponent(pc);
	}
});