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
		if (pid.toString() == "[object Object]") 
		{
			throw new "pid is object";
		}
		this._pid = pid
		this._mRecord.setPrefix(pid + "/m/");
		this._sRecord.setPrefix(pid + "/s/");
		this._pRecord.setPrefix(pid + "/p/");
		return this;
	},
	
	permissions: function()
	{
		if(this._permissions) { return this._permissions; }
		
		this._permissions = PNodePermissions.clone().setNode(this);
		this._permissions.read();
		
		//writeln("returning this._permissions = " + this._permissions)
		return this._permissions;
	},

	at: function(k)
	{
		var pid = this.sRecord().at(k);
		
		if (pid) 
		{
			if (pid.toString() == "[object Object]") 
			{
				this.rm(k);
				writeln("this.sRecord().fullKey(k)  = ", this.sRecord().fullKey(k));
				writeln("pid  = ", JSON.stringify(pid));
				writeln("removing slot to repair!")
				throw new "pid is object";
			}
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
	
	nodeAtPath: function(path, user)
	{
		var path = path.removePrefix("/");
		return this.nodeAtPathComponents(path.pathComponents(), user);
	},

	nodeAtPathComponents: function(pathComponents, user)
	{
		var node = this;
		var k = pathComponents.removeAt(0);
	
		if(user && !node.permissions().isReadableByUser(user))
		{
			throw new Error("insufficient read permissions on path " + user.description() + " " + this.permissions().description());
		}
		
		if (k == null || k == "") 
		{ 
			return this;
		}
	
		var nextPNode = node.at(k);
	
		if (nextPNode == null) 
		{ 
			return null;
		}
	
		return nextPNode.nodeAtPathComponents(pathComponents, user);
	},

	createPNodeAtPath: function(path, user)
	{
		return this.createPNodeAtPathComponents(path.pathComponents(), user);
	},

	createPNodeAtPathComponents: function(pathComponents, user)
	{
		var node = this;
		var k = pathComponents.removeAt(0);
	
		if (k == null)
		{ 
			return this;
		}
		
		if (k == "")
		{
			throw new Error("Can't create node at empty key");
		}
				
		if(user && !node.permissions().isReadableByUser(user))
		{
			throw new Error("insufficient read permissions on path " + user.description() + " " + this.permissions().description());
		}
		
		var nextPNode = node.at(k);
		
		if(!nextPNode)
		{
			if(user && !node.permissions().isWritableByUser(user))
			{
				throw new Error("insufficient write permissions on path");
			}
			
			nextPNode = node.mk(k);
		}
		
		return nextPNode.createPNodeAtPathComponents(pathComponents, user);
	},

	createPNodeAt: function(key)
	{
		return this.createPNodeAtPathComponents([key]);
	},

	//-- size ---------------------------------------------------------------

	size: function()
	{
		return new Number(this.pRecord().at("size"));
	},

	//-- ops ---------------------------------------------------------------

	link: function(k, aPNode)
	{
		if (aPNode) 
		{
			this.atPut(k, aPNode.pid());
			return this;
		}
	
		return null;
	},

	//-- slot ops ---------------------------------------------------------------

	hasSlot: function(k)
	{
		return this.sRecord().hasKey(k);
	},
	
	rename: function(k1, k2)
	{
		var v = this.at(k1);
		if (v != null)
		{
			// /writeln("rename(" + k1 + ", " + k2 + ") = ", v.pid());
			if(k2 && k2 != "") this.atPut(k2, v.pid());
			this.removeAt(k1);
		}
		return this;
	},

	atPut: function(k, v)
	{
		var hadKey = this.hasSlot(k);
		this.sRecord().atPut(k, v);
	
		if (hadKey == false) 
		{
			this.pRecord().incrementKey("size");
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
	
		this.pRecord().atPut("size", count.toString());
		return this
	},

	//-- mRecord ops ---------------------------------------------------------------

	mwrite: function(k, v)
	{
		this.mRecord().atPut(k, v);
		return this
	},

	mread: function(k)
	{
		return this.mRecord().at(k);
	},

	mrm: function(k)
	{
		return this.mRecord().removeAt(k);
	},
	
	//-- type mRecord value -----------------------------

	setType: function(v)
	{
		this.mwrite("type", v);
		//this._object = null;
		return this;
	},

	type: function(v)
	{
		return this.mread("type");
	},

	//-- data mRecord value -----------------------------

	setData: function(v)
	{
		this.mwrite("data", v);
		return this;
	},

	data: function(v)
	{
		return this.mread("data");
	},

	//-- cursors -----------------------------------------

	slotCursor: function()
	{
		return this.sRecord().cursor();
	},

	mRecordCursor: function()
	{
		return this.mRecord().cursor();
	},
	
	deepCopySlotTo: function(k1, k2)
	{
		this.atPut(k2, this.at(k1).deepCopy().pid());
		return this;
	},
	
	deepCopy: function()
	{
		if(this.hasRefLoop() != false)
		{
			throw "ref loop found on deepCopy attempt";
		}
		
		var newNode = PNode.clone().setPdb(this._pdb).create();

		var c = this.slotCursor();	
		c.first();
		while(c.key())
		{
			var subnode = this.at(c.key());
			newNode.atPut(c.key(), subnode.deepCopy().pid());
			c.next()
		}
		
		var c = this.mRecordCursor();	
		c.first();
		while(c.key())
		{
			newNode.mwrite(c.key(), c.value());
			c.next()
		}
		
		return newNode;
	},
	
	hasRefLoop: function(refs) // returns pid if there is a loop
	{
		if(refs == null) { refs = {}; }
		var c = this.slotCursor();	
		c.first();
		while(c.key())
		{
			var pid = c.value();
			if(refs[pid] == null)
			{
				var subnode = this._pdb.nodeForPid(pid);
				refs[pid] = 1;
				var loopFound = subnode.hasRefLoop(refs);
				if(loopFound != false)
				{
					return loopFound;
				}
			}
			else
			{
				return pid; // loop detected;
			}
			c.next()
		}
		
		return false;
	},
	
	keys: function()
	{
		return this.slotCursor().keys();
	},
	
	//-- iterators -----------------------------------------
	
	eachSlot: function(fn, reverse)
	{
		var cur = this.slotCursor();
		
		if(reverse)
		{
			cur.last();
		}
		else
		{
			cur.first();
		}
		
		var k;
		while(k = cur.key())
		{
			var node = this.at(k);
			if(fn.call(node, node, k))
			{
				break;
			}
			
			if (reverse)
			{
				cur.prev();
			}
			else
			{
				cur.next();
			}
		}
		
		return this;
	},
	
	eachSlotReverse: function(fn)
	{
		return this.eachSlot(fn, true);
	}
})
