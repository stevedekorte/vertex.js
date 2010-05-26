var TC = require('./lib/TokyoCabinet/tokyocabinet');

PDB = Proto.clone().newSlots({	
	protoType: "PDB",
	tc: null,
	path: "default.tc",
	rootPNode: null,
	collector: null,
	isOpen: false,
	debug: false
	//nodePool: {}
}).setSlots({
	init: function()
	{
		this._tc = new TC.BDB
		this._rootPNode = PNode.clone().setPdb(this).setPid(0)
		this._collector = Collector.clone().setPdb(this)
		//this._nodePool = {}
	},

	exists: function()
	{
		return File.clone().setPath(this.path()).exists()
	},
	
	root: function()
	{
		return this._rootPNode
	},
	
	debugWriteln: function(msg)
	{
		if(this._debug)
		{
			writeln(msg)
		}
	},

	showError: function()
	{
		var ecode = this._tc.ecode()
		if(ecode)
		{
			this.debugWriteln("PDB error: " + this._tc.errmsg(ecode))
		}
	},

	createRootPNodeIfNeeded: function()
	{
		if (this._rootPNode.exists()) 
		{
			//this.debugWriteln("PDB:createRootPNodeIfNeeded() PDB root node found")
		}
		else
		{
			//this.debugWriteln("PDB:createRootPNodeIfNeeded() creating root node")
			this._rootPNode.mRecord().zeroKey("size")
			this._tc.sync()
		}
	},

	open: function()
	{
		if(this.isOpen()) 
		{
			return;
		}
		
		if (!this._tc.open(this.path(), TC.BDB.OWRITER | TC.BDB.OCREAT | TC.BDB.OTSYNC | TC.BDB.ONOLCK)) 
		{
		   this.showError()
		}
		else
		{
			this.setIsOpen(true)
		}
		this.createRootPNodeIfNeeded()
		this.collector().resetHighWaterMark()
		return this;
	},

	close: function()
	{
		if(!this.isOpen())
		{
			return
		}
		
		if (!this._tc.close()) 
		{
		   this.showError()
		}
		this.setIsOpen(false)
	},

	at: function(k)
	{
		var v = this._tc.get(k)
		return v;
	},

	sizeAt: function(k)
	{
		return this._tc.vsiz(k)
	},

	/*
	atIncrement: function(k, v)
	{
		if (v == null) { v = 1 }
		this._tc.addint(k, v)
		return this
	},
	*/

	atPut: function(k, v)
	{
		this.debugWriteln("    PDB.atPut('" + k + "', '" + v + "')")
		if (this._collector.isRunning()) 
		{
			// innefficient - we should avoid these extra string ops
			this._collector.addPidToBeMarked(k.before("/"))
		}
		this._tc.put(k, v)
		return this
	},

	removeAt: function(k)
	{
		this.debugWriteln("PDB.removeAt('" + k + "') ")
		this._tc.out(k)
		return this
	},

	createPNodeAtPath: function(path)
	{
	    return this._rootPNode.createPNodeAtPath(path)
	},

	nodeAtPath: function(path)
	{
		return this._rootPNode.nodeAtPath(path.removePrefix("/"))
	},

	nodeForPid: function(pid)
	{
		// use node pool?
		return PNode.clone().setPdb(this).setPid(pid)
	},

	begin: function()
	{
		if (this._inTransaction == 1) 
		{
			this.debugWriteln("PDB ABORT")
			this.abort()
		}
		this.debugWriteln("PDB BEGIN")
		this._tc.tranbegin()
		this._inTransaction = 1
		return this
	},

	commit: function()
	{
		this.debugWriteln("PDB COMMIT")
		this._tc.trancommit()
		this._inTransaction = null
		return this
	},

	abort: function()
	{
		this._tc.tranabort()
		this._inTransaction = null
		return this
	},

	newCursor: function()
	{
		return new TC.BDBCUR(this._tc)
	},

	sizeInBytes: function()
	{
		return this._tc.fsiz()
	},

	idle: function()
	{
		this._collector.idle()
	},

	collectIfNeeded: function()
	{
		this._collector.collectIfNeeded()
	},
	
	rawKeyCount: function()
	{
		var count = 0
		var cur = this.newCursor()
		cur.first()
		while (cur.key())
		{
			count = count + 1
			cur.next()
		}	
		return count;
	},
	
	showRawKeyValues: function()
	{
		var cur = this.newCursor()
		cur.first()
		while (cur.key())
		{
			writeln("    ", cur.key(), ": '", new String(cur.val()), "'")
			cur.next()
		}	
	},
	
	show: function()
	{
		writeln("PDB:")
		writeln("  path: ", this.path())
		writeln("  sizeInBytes: ", this.sizeInBytes())
		writeln("  rawKeyCount: ", this.rawKeyCount())
		this.showRawKeyValues()
	},
	
	vanish: function()
	{
		this.close()
		File.clone().setPath(this.path()).remove()
		return this
	},
	
	protoNamed: function(name)
	{
		return global[name];
	}
})
