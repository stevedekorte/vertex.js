VJSIndex = Delegator.clone().newSlots({
	vjsParent: null,
	vjsLoadPath: null,
	vjsObjects: null,
	vjsKey: null
}).setSlots({
	init: function()
	{
		Delegator.init.call(this);
		this.setVjsObjects([]);
	},
	
	vjs: function()
	{
		return VJS.clone().addDelegate(this);
	},
	
	vjsPath: function()
	{
		var key = this.vjsKey();
		var parent = this.vjsParent();
		
		if(parent && key)
		{
			//return this.vjsParent().vjsPath() + "/" + encodeURIComponent(key);
			return this.vjsParent().vjsPath() + "/" + key;
		}
		else
		{
			return this.vjsLoadPath();
		}
	},
	
	load: function()
	{
		this.setVjsObjects([]);
		
		this.vjs().addDelegate(this, "load").ls(
			this.vjsPath(),
			null, //max
			null, //start
			null, //reverse
			null, //returnCount
			true, //inline
			null //selectExpression
		)
		
		return this;
	},
	
	loadCommitted: function(vjs)
	{
		var self = this;
		vjs.result().first().forEach(function(slot)
		{
			var slotName = slot.first();
			var slotObj = slot.last();
			var vjsProto = slotObj.vjsProto;
			delete slotObj.vjsProto;
			
			var vjsLoadPath = self.vjsPath() + "/" + slotName;
			
			if(!vjsProto)
			{
				writeln("WARNING: vjsProto is missing from " + vjsLoadPath);
				vjsProto = VJSObject;
			}
			
			var vjsObj = global[vjsProto].clone();
			vjsObj.setVjsParent(self);
			vjsObj.setVjsLoadPath(vjsLoadPath);
			Object_eachSlot_(slotObj, function(k, v){
				if(vjsObj.hasSlot(k))
				{
					vjsObj.perform("set" + k.asCapitalized(), v);
				}
				else
				{
					writeln("WARNING: no vjsSlot named " + k + " for " + vjsLoadPath);
					vjsObj.newSlot(k, v);
				}
			});
			vjsObj.setVjsNeedsSave(false);
			
			self.vjsObjects().push(vjsObj);
		});
		
		self.sendDelegates("loaded");
	},
	
	loadCommitFailed: function(vjs, e)
	{
		this.sendDelegates("loadFailed", e);
	},
});