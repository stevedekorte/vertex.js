var TC = require('./lib/TokyoCabinet/tokyocabinet');

PDB = Proto.clone().newSlots({	
	protoType: "PDB",
	tc: null,
	path: "default.tc",
	rootPNode: null,
	collector: null,
	isOpen: false,
	debug: false,
	undoDict: null
	//nodePool: {} // add later for cacheing
}).setSlots({
	init: function()
	{
		this._tc = new TC.BDB;
		this._rootPNode = PNode.clone().setPdb(this).setPid(0);
		this._collector = Collector.clone().setPdb(this);
		this._undoDict = {};
		//this._nodePool = {}
	},

	exists: function()
	{
		return File.clone().setPath(this.path()).exists();
	},
	
	root: function()
	{
		return this._rootPNode;
	},
	
	debugWriteln: function(msg)
	{
		if(this._debug)
		{
			writeln(msg);
		}
	},

	showError: function()
	{
		var ecode = this._tc.ecode();
		if(ecode)
		{
			this.debugWriteln("PDB error: " + this._tc.errmsg(ecode));
		}
	},

	createRootPNodeIfNeeded: function()
	{
		if (!this._rootPNode.exists()) 
		{
			this._rootPNode.pRecord().zeroKey("size");
			this._tc.sync();
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
			this.showError();
			throw "FAILED TO OPEN PDB at path " + this.path();
		}
		else
		{
			this.setIsOpen(true);
		}
		
		this.createRootPNodeIfNeeded();
		this.collector().resetHighWaterMark();
		return this;
	},

	close: function()
	{
		if(!this.isOpen())
		{
			return;
		}
		
		if (!this._tc.close()) 
		{
		   this.showError();
		}
		
		this.setIsOpen(false);
	},
	
	at: function(k)
	{
		return this._tc.get(k);
	},

	sizeAt: function(k)
	{
		return this._tc.vsiz(k);
	},

	/*
	atIncrement: function(k, v)
	{
		if (v == null) 
		{ 
			v = 1 
		}
		
		this._tc.addint(k, v)
		return this
	},
	*/
	
	// undo ----------------------------------------------------
	
	rememberKeyForUndo: function(k)
	{
		var d = this._undoDict;

		if(d[k] == undefined)
		{ 
			var v = this._tc.get(k);
			// non-existent slots get recorded as null
			
			if(v == undefined) 
			{
				v = null;
			}
			
			d[k] = v; 
		}		
	},
	
	clearUndo: function()
	{
		this._undoDict = {}
	},
	
	undo: function()
	{
		var d = this._undoDict;
		var tc = this._tc;
		
		for(k in d)
		{
			var v = d[k];

			if(v == null)
			{
				tc.out(k);
			}
			else
			{
				tc.put(k, v);
			}
		}
	},
	
	// transactions ---------------------------------
	
	begin: function()
	{
		this.clearUndo();
		if (this._inTransaction) 
		{
			return
		}
		
		this._tc.tranbegin();
		this._inTransaction = true;
		return this;
	},

	commit: function()
	{
		if (this._inTransaction) 
		{
			this._tc.trancommit();
			this._inTransaction = false;
		}
		return this;
	},

	abort: function()
	{
		this.undo();
		this._inTransaction = false;
		return this
	},
	
	/*
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
	*/

	// writes -------------------------------------------------------
	
	atPut: function(k, v)
	{
		//this.debugWriteln("    PDB.atPut('" + k + "', '" + v + "')")
		if (this._collector.isRunning()) 
		{
			// innefficient - we should avoid these extra string ops
			this._collector.addPidToBeMarked(k.before("/"));
		}
		
		this.rememberKeyForUndo(k);
		this._tc.put(k, v);
		return this;
	},

	removeAt: function(k)
	{
		//this.debugWriteln("PDB.removeAt('" + k + "') ")
		this.rememberKeyForUndo(k);
		this._tc.out(k);
		return this
	},
	
	// --------------------------------------------------------

	createPNodeAtPath: function(path)
	{
	    return this._rootPNode.createPNodeAtPath(path);
	},

	nodeAtPath: function(path)
	{
		return this._rootPNode.nodeAtPath(path.removePrefix("/"));
	},

	nodeForPid: function(pid)
	{
		// use node pool later
		return PNode.clone().setPdb(this).setPid(pid);
	},

	newCursor: function()
	{
		return new TC.BDBCUR(this._tc);
	},

	sizeInBytes: function()
	{
		return this._tc.fsiz();
	},

	idle: function(dt)
	{
		this._collector.idle(dt);
	},

	needsIdle: function()
	{
		return this._collector.needsIdle();
	},
	
	nodeCount: function()
	{
		// optimize later to use jump
		var count = 0;
		var cur = this.newCursor();
		cur.first();
		while (cur.key())
		{
			if(cur.key().endsWith("/p/size"))
			{
				count = count + 1;
			}
			cur.next();
		}	
		return count;
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
		var cur = this.newCursor();
		cur.first();
		while (cur.key())
		{
			writeln("    ", cur.key(), ": '", new String(cur.val()), "'");
			cur.next();
		}	
	},
	
	show: function()
	{
		writeln("PDB:");
		writeln("  path: ", this.path());
		writeln("  sizeInBytes: ", this.sizeInBytes());
		writeln("  rawKeyCount: ", this.rawKeyCount());
		writeln("         keys: ");
		this.showRawKeyValues();
		writeln("\n\n");
	},
	
	vanish: function()
	{
		this.close();
		File.clone().setPath(this.path()).remove();
		return this;
	},
	
	protoNamed: function(name)
	{
		return global[name];
	}
})
