
PNode = Proto.clone().newSlots({
	protoType: "PNode",
	pdb: null,
	pid: 0,
	mRecord: null,
	sRecord: null,
	pRecord: null,
	object: null,
	view: null
}).setSlots({

	init: function()
	{
		this._pdb = null;
		this._pid = 0;
	},
	
	mRecord: function()
	{
		if (this._mRecord == null) 
		{
			this._mRecord = PRecord.clone().setPdb(this._pdb).setPrefix(this._pid + "/m/")
		}
		return this._mRecord
	},

	sRecord: function()
	{
		if (this._sRecord == null) 
		{
			this._sRecord = PRecord.clone().setPdb(this._pdb).setPrefix(this._pid + "/s/")
		}
		return this._sRecord
	},
	
	pRecord: function()
	{
		if (this._pRecord == null) 
		{
			this._pRecord = PRecord.clone().setPdb(this._pdb).setPrefix(this._pid + "/p/")
		}
		return this._pRecord
	},

	at: function(k)
	{
		//writeln("PNode(" + this._pid + ").at('" + k.toString() + "')")
		var pid = this.sRecord().at(k)
		if (pid) 
		{
			return this._pdb.nodeForPid(pid)
		}
		return null
	},

	mk: function(k)
	{
		var node = this.at(k)
		if (node == null) 
		{
			node = PNode.clone().setPdb(this._pdb).create()
			this.atPut(k, node.pid())
		}
		return node
	},

	//-- creation ---------------------------------------------------------------

	newPid: function()
	{
		var maxPid = Math.pow(2, 30)
		while (1) 
		{
			this._pid = Math.floor(Math.random()*maxPid)
			//writeln("// PNode(" + this._pid + ").newPid() " + this._pid)
			if (this._pdb.at(this._pid + "/p/size") == null) 
			{
				break
			}
		}
	},

	exists: function()
	{
		return this.pRecord().hasKey("size")
	},

	create: function()
	{
		this.newPid()
		this._mRecord = null
		this._sRecord = null
		this._pRecord = null
		this.pRecord().zeroKey("size")
		return this
	},


	//-- paths ----------------------------------------------------------

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

	createPNodeAtPathComponents: function(pathComponents)
	{
		var node = this
		var k = pathComponents.removeAt(0)
	
		if (k == null)
		{ 
			return this 
		}
	
		var nextPNode = node.mk(k)	
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
		//writeln("PNode.removeAt('" + k + "')")
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

	mRecordRemoveAt: function(k)
	{
		return this.mRecord().removeAt(k)
	},
	
	//-- type mRecord value -----------------------------

	setType: function(v)
	{
		this.mwrite("type", v)
		this._object = null
		return this
	},

	type: function(v)
	{
		return this.mread("type")
	},

	object: function()
	{
		if (this._object == null) 
		{
			var protoName = this.type()
			if (protoName == null) 
			{
				protoName = "PObject"
			}
			var proto = this._pdb.protoNamed(protoName)
			if(!proto)
			{
				throw new Error("No proto named " + protoName);
			}
			this._object = proto.clone().setPNode(this)
		}
		return this._object
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

	//-- view mRecord value -----------------------------

	setViewName: function(v)
	{
		this.mwrite("viewName", v)
		this._view = null
		return this
	},

	viewName: function(v)
	{
		return this.mread("viewName")
	},

	view: function()
	{
		if (this._view == null) 
		{
			var viewName = this.viewName()
			var g = getfenv(0)
			var proto = null
		
			if (this.type()) 
			{ 
				proto = g[this.type()]	
			}

			if (proto == null) 
			{
				proto = g["PNodeView"]	
			}
		
			this._view = proto.clone().setPNode(this)
		}
		return this._view
	},

	//-- cursors -----------------------------------------

	slotCursor: function()
	{
		return this.sRecord().cursor()
	},

	mRecordCursor: function()
	{
		return this.mRecord().cursor()
	},

	asJson: function(start, max)
	{
		var t = {};
		var c = this.sRecord().cursor();
	
		if (start) 
		{ 
			c.jump(start)
		}
		else
		{
			c.first()
		}
	
		var k = c.key()
		var count = 0
		while (k  && count < max) 
		{
			var v = this.at(k).object().asStringValue()
			if (v) 
			{
				t.get(k) = c.value()
			}
			count = count + 1
			c.next()
			k = c.key()
		}
	
		return Json.Encode(t)
	}
})
