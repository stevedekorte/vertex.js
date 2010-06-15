require("./PNodePermissions");

PNode = Proto.clone().newSlots({
	protoType: "PNode",
	pdb: null,
	pid: 0,
	mRecord: null,
	sRecord: null,
	pRecord: null,
	permissions: null
}).setSlots({

	init: function()
	{
		this._pdb = null;
		this._pid = 0;
		this._mRecord = PRecord.clone();
		this._sRecord = PRecord.clone();
		this._pRecord = PRecord.clone();
		this._permisssions = PNodePermissions.clone().setNode(this);
	},
	
	setPdb: function(pdb)
	{
		this._pdb = pdb;
		this._mRecord.setPdb(pdb);
		this._sRecord.setPdb(pdb);
		this._pRecord.setPdb(pdb);
		return this;
	},
	
	setPid: function(pid)
	{
		this._pid = pid
		this._mRecord.setPrefix(pid + "/m/");
		this._sRecord.setPrefix(pid + "/s/");
		this._pRecord.setPrefix(pid + "/p/");
		return this;
	},

	at: function(k)
	{
		var pid = this.sRecord().at(k);
		
		if (pid) 
		{
			return this._pdb.nodeForPid(pid);
		}
		
		return null;
	},

	mk: function(k)
	{
		var node = this.at(k);
		
		if (node == null) 
		{
			node = PNode.clone().setPdb(this._pdb).create();
			this.atPut(k, node.pid());
		}
		
		return node;
	},

	//-- creation ---------------------------------------------------------------

	newPid: function()
	{
		var maxPid = Math.pow(2, 30);
		while (1) 
		{
			var pid = Math.floor(Math.random() * maxPid);
			if (this._pdb.at(pid + "/p/size") == null) 
			{
				this.setPid(pid);
				break;
			}
		}
	},

	exists: function()
	{
		return this.pRecord().hasKey("size");
	},

	create: function()
	{
		this.newPid();
		this.pRecord().zeroKey("size");
		return this;
	},

	//-- paths ----------------------------------------------------------

	isWritableByUser: function(user)
	{
		return this.permissions().isWritableByUser(user);
	},
	
	isReadableByUser: function(user)
	{
		return this.permissions().isReadableByUser(user);
	},
	
	permittedNodeAtPathComponents: function(pathComponents, user)
	{
		if(!user) throw "invalid user";
		
		var node = this;
		var k = pathComponents.removeAt(0);
	
		if (k == null || k == "") 
		{ 
			return this;
		}
	
		var nextPNode = node.at(k);
		
		if(nextPNode.isReadableByUser(user))
		{
			throw "insufficient permissions to access path component " + k;
		}

		if (nextPNode == null) 
		{ 
			return null;
		}
	
		return nextPNode.permissionedNodeAtPathComponents(pathComponents, user);
	},
	
	nodeAtPath: function(path)
	{
		return this.nodeAtPathComponents(path.pathComponents())
	},

	nodeAtPathComponents: function(pathComponents)
	{
		var node = this
		var k = pathComponents.removeAt(0)
	
		if (k == null || k == "") 
		{ 
			return this 
		}
	
		var nextPNode = node.at(k)
	
		if (nextPNode == null) 
		{ 
			return null
		}
	
		return nextPNode.nodeAtPathComponents(pathComponents)
	},

	createPNodeAtPath: function(path)
	{
		return this.createPNodeAtPathComponents(path.pathComponents())
	},

	createPNodeAtPathComponents: function(pathComponents, user)
	{
		var node = this
		var k = pathComponents.removeAt(0)
	
		if (k == null)
		{ 
			return this 
		}

		if(user && !node.permissions().isReadableByUser(user))
		{
			throw "insufficient read permissions on path";
		}
		
		var nextPNode = node.at(k);
		
		if(!nextPNode)
		{
			if(user && !node.permissions().isWritableByUser(user))
			{
				throw "insufficient write permissions on path";
			}
			
			nextPNode = node.mk(k)	
		}
		
		return nextPNode.createPNodeAtPathComponents(pathComponents)
	},

	createPNodeAt: function(key)
	{
		return this.createPNodeAtPathComponents([key])
	},

	//-- size ---------------------------------------------------------------

	size: function()
	{
		return new Number(this.pRecord().at("size"))
	},

	//-- ops ---------------------------------------------------------------

	link: function(k, aPNode)
	{
		if (aPNode) 
		{
			this.atPut(k, aPNode.pid())
			return this
		}
	
		return null
	},

	//-- slot ops ---------------------------------------------------------------

	hasSlot: function(k)
	{
		return this.sRecord().hasKey(k)
	},

	atPut: function(k, v)
	{
		var hadKey = this.hasSlot(k)
		this.sRecord().atPut(k, v)
	
		if (hadKey == false) 
		{
			this.pRecord().incrementKey("size")
		}
	
		return this
	},

	rm: function(k)
	{
		return this.removeAt(k)
	},

	removeAt: function(k)
	{
		var hadKey = this.hasSlot(k)
		this.sRecord().removeAt(k)
	
		if (hadKey) 
		{
			var size = this.pRecord().decrementKey("size")
			if (size < 0) 
			{
				writeln("ERROR: PNode negative size written")
			}
		}
	
		return this
	},

	removeAll: function()
	{
		var count = 0
		var c = this.sRecord().cursor()
	
		c.first()
		while (c.key()) 
		{
			count = count + 1
			c.out()
		}
	
		this.pRecord().atPut("size", count.toString())
		return this
	},

	//-- mRecord ops ---------------------------------------------------------------

	mwrite: function(k, v)
	{
		this.mRecord().atPut(k, v)
		return this
	},

	mread: function(k)
	{
		return this.mRecord().at(k)
	},

	mrm: function(k)
	{
		return this.mRecord().removeAt(k)
	},
	
	//-- type mRecord value -----------------------------

	setType: function(v)
	{
		this.mwrite("type", v)
		//this._object = null
		return this
	},

	type: function(v)
	{
		return this.mread("type")
	},

	//-- data mRecord value -----------------------------

	setData: function(v)
	{
		this.mwrite("data", v)
		return this
	},

	data: function(v)
	{
		return this.mread("data")
	},

	//-- cursors -----------------------------------------

	slotCursor: function()
	{
		return this.sRecord().cursor()
	},

	mRecordCursor: function()
	{
		return this.mRecord().cursor()
	}
})
