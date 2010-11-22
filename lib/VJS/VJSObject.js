VJSObject = Delegator.clone().newSlots({
	vjsParent: null,
	vjsLoadPath: null,
	vjsSlots: [],
	vjsIndexes: [],
	vjsProto: "VJSObject",
	vjsKey: null,
	vjsNeedsSave: null
}).setSlots({
	init: function()
	{
		Delegator.init.call(this);
		
		this.setVjsNeedsSave(true);
		this.setVjsSlots(this.vjsSlots().copy());
		this.setVjsIndexes(this.vjsIndexes().copy());
	},
	
	vjs: function()
	{
		/*
		if(!this._vjs)
		{
			this._vjs = VJS.clone().addDelegate(this);
		}
		
		return this._vjs;
		*/
		
		return VJS.clone().addDelegate(this);
	},
	
	vjsLoadKey: function()
	{
		return this.vjsLoadPath().lastPathComponent();
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
	
	setSlotWithoutNeedsSave: Delegator.setSlot,
	
	setSlot: function(name, value)
	{
		if(this["_" + name] == value)
		{
			return this;
		}
		else
		{
			this.setVjsNeedsSave(true);
			return this.setSlotWithoutNeedsSave(name, value);
		}
	},
	
	vjsNewSlot: function(name, defaultValue)
	{
		this.newSlot(name, defaultValue);
		
		this.vjsSlots().appendIfAbsent(name);
		
		return this;
	},
	
	vjsNewSlots: function(slotsObj)
	{
		var self = this;
		Object_eachSlot_(slotsObj, function(k, v)
		{
			self.vjsNewSlot(k, v);
		});
		
		return this;
	},
	
	vjsNewIndex: function(name)
	{
		this.vjsIndexes().appendIfAbsent(name);
		this[name] = function()
		{
			var index = this["_" + name];
			if(!index)
			{
				index = VJSIndex.clone();
				index.setVjsKey(name);
				index.setVjsParent(this);
				
				this["_" + name] = index;
			}
			
			return index;
		}
		return this;
	},
	
	vjsNewIndexes: function()
	{
		var self = this;
		Arguments_asArray(arguments).forEach(function(indexName)
		{
			self.vjsNewIndex(indexName);
		});
		return this;
	},
	
	vjsCheckExistence: function()
	{
		this.vjs().addDelegate(this, "vjsCheckExistence");
	},
	
	vjsCheckExistenceCommitted: function(vjs)
	{
		this.sendDelegates("checkedExistence", vjs.result().first() != null);
	},
	
	vjsCheckExistenceFailed: function(vjs, e)
	{
		this.sendDelegates("checkedExistenceFailed", e);
	},
	
	vjsLoad: function()
	{
		this.vjs().addDelegate(this, "vjsLoad").obj(this.vjsPath());
		return this;
	},
	
	vjsLoadCommitted: function(vjs)
	{
		var obj = vjs.result().first();
		
		if (obj)
		{
			this.vjsSetSlots(obj);
			this.setVjsNeedsSave(false);
			this.sendDelegates("loaded");
		}
		else
		{
			this.sendDelegates("loadMissing");
		}
	},
	
	vjsLoadCommitFailed: function(vjs, e)
	{
		this.sendDelegates("loadFailed", e);
	},
	
	vjsSetSlots: function(obj)
	{
		var self = this;
		Object_eachSlot_(obj, function(k, v){
			if(self.hasSlot(k))
			{
				self.perform("set" + k.asCapitalized(), v);
			}
			else
			{
				writeln("WARNING: no vjsSlot named " + k + " for " + self.vjsPath());
				self.newSlot(k, v);
			}
		});
	},
	
	vjsSave: function()
	{
		if(this.vjsNeedsSave())
		{
			this.vjsJustSave();
		}
		else
		{
			var self = this;
			setTimeout(function(){ self.sendDelegates("saved") }, 0);
		}
		return this;
	},
	
	vjsJustSave: function()
	{
		this.vjsWillSave();

		var self = this;
		var path = this.vjsPath();

		var vjs = this.vjs().begin();
		vjs.addDelegate(this, "vjsSave");
		
		this.vjsAtPathSaveToVjs(path, vjs);
		
		this.vjsWillCommitSave(vjs);

		vjs.commit();
		
		return this;
	},
	
	vjsAtPathSaveToVjs: function(path, vjs)
	{
		var self = this;
		this.vjsSlots().forEach(function(slotName)
		{
			var value = self.perform(slotName);
			//vjs.mk(path.appendPC(encodeURIComponent(slotName)), value.vjsType(), value.asVjsData());
			vjs.mk(path.appendPC(slotName), value.vjsType(), value.asVjsData());
		});
		
		var vjsProtoPath = path.appendPC("vjsProto");
		vjs.mk(vjsProtoPath, "String", this.vjsProto());
		vjs.mwrite(vjsProtoPath, "isHidden", "true");
		
		
		this.vjsIndexes().forEach(function(indexName){
			vjs.mk(path + "/" + indexName);
		});
		
		return this;
	},
	
	vjsWillSave: function()
	{
		return this;
	},
	
	vjsWillCommitSave: function()
	{
		return this;
	},
	
	vjsSaveCommitted: function(vjs)
	{
		this.sendDelegates("saved");
	},
	
	vjsSaveFailed: function(vjs, e)
	{
		this.sendDelegates("saveFailed", e);
	},
	
	vjsSaveIfAbsent: function()
	{
		this.addDelegate(this, "vjsSaveIfAbsent");
		this.checkExistence();
	},
	
	vjsSaveIfAbsentCheckedExistence: function(vjsObject, exists)
	{
		this.removeDelegate(this);
		if(exists)
		{
			setTimeout(function(){ self.sendDelegates("saved") }, 0);
		}
		else
		{
			this.vjsSave();
		}
	},
	
	vjsSaveIfAbsentCheckExistenceFailed: function(vjsObject, e)
	{
		this.removeDelegate(this);
		this.sendDelegates("saveFailed", e);
	},
	
	vjsAsJsonObject: function()
	{
		var jsonObject = {};
		this.vjsSlots().forEach(function(slotName){
			jsonObject[slotName] = this.perform(slotName);
		});
		
		return jsonObject;
	},
});