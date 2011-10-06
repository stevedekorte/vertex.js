var TC = require('./lib/TokyoCabinet/tokyocabinet');

PDB = Proto.clone().newSlots({	
	protoType: "PDB",
	tc: null,
	path: "default.tc",
	rootPNode: null,
	collector: null,
	isOpen: false,
	debug: false,
	undoDict: null,
	rootPNode: null,
	nodePool: null, 
	nodePoolCount: 0
}).setSlots({
	init: function()
	{
		this._tc = new TC.BDB;
		this._tc.tune(128, 256, 31250000, 256, 1024, TC.BDB.TLARGE);
		this._rootPNode = PNode.clone().setPdb(this).setPid(0);
		this._collector = Collector.clone().setPdb(this);
		this._undoDict = {};
		this._nodePool = {};
		this._nodePoolCount = 0;
		this._nodePoolHighWaterMark = 1000;
		this._nodePoolLowWaterMark = 0;
	},
	
	cleanNodePool: function()
	{
		if(this._nodePoolCount > this._nodePoolHighWaterMark)
		{
			// replace this with a LRU linked list  
			var newPool = {};
			var count = 0;
			for(k in this._nodePool)
			{
				newPool[k] = this._nodePool[k];
				count ++;
				if(count > this._nodePoolLowWaterMark)
				{
					break;
				}
			}
			this._nodePool = newPool;
			this._nodePoolCount = count;
		}
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
			writeln("PDB error: " + this._tc.errmsg(ecode));
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
		
		if (!this._tc.open(this.path(), TC.BDB.OWRITER | TC.BDB.OCREAT | TC.BDB.OTSYNC)) // | TC.BDB.ONOLCK)) 
		{
			this.showError();
			throw "FAILED TO OPEN PDB at path " + this.path();
		}
		else
		{
			this.setIsOpen(true);
		}
/*
this.show();
*/
		
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
		this.clearUndo();
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
			var begin = new Date;
			this._tc.trancommit();
//this.show();
			//writeln("commit (",  (new Date().getTime() - begin.getTime())/1000,"s)");
			this._inTransaction = false;
			this.cleanNodePool(); // safe here?
		}
		return this;
	},

	abort: function()
	{
		this.undo();
		//this._inTransaction = false; // DO NOT DO THIS NOW, AS THE TRANSACTION IS STILL ACTIVE
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
//writeln("atPut(", k, ",", v, ")");
		if (this._collector.isRunning()) 
		{
			// innefficient - we should avoid these extra string ops
			this._collector.addPidToBeMarked(k.before("/"));
		}
		
		this.rememberKeyForUndo(k);
//writeln("put: ", k, " => ", v);
		this._tc.put(k, v);
		return this;
	},

	removeAt: function(k)
	{
		//this.debugWriteln("PDB.removeAt('" + k + "') ")
		this.rememberKeyForUndo(k);
//writeln("out: ", k);
		this._tc.out(k);
		return this
	},
	
	// --------------------------------------------------------

	/*
	createPNodeAtPath: function(path)
	{
	    return this._rootPNode.createPNodeAtPath(path);
	},

	nodeAtPath: function(path)
	{
		return this._rootPNode.nodeAtPath(path.removePrefix("/"));
	},
	
	nodesOnPath: function(path)
	{
		var nodes = []
		var node = node._rootPNode;
		var components = path.pathComponents();
		for(var i = 0; v < components.length; i++)
		{
			var comp = components[i];
			node.nodeAt(
		}
		return this._rootPNode.nodeAtPath(path.removePrefix("/"));
	},
	*/
	
	willRemovePid: function(pid)
	{
		delete this._nodePool[pid];
		this._nodePoolCount --;
	},

	nodeForPid: function(pid)
	{
		// use node pool later
		if(this._nodePool)
		{
			var node = this._nodePool[pid];
			if(node) return node;
		}
		
		var node = PNode.clone().setPdb(this).setPid(pid);
		if(this._nodePool) 
		{
			this._nodePool[pid] = node;
			this._nodePoolCount ++;
			this.cleanNodePool();
			//require('util').debug("pool " + this._nodePoolCount);
			
		}
		return node;
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
	},
	
	compact: function()
	{
		var fs = require('fs');
		
		this.close();
		
		var indb = new TC.BDB;
		var inpath = this.path();
		if (!indb.open(inpath, TC.BDB.OREADER))
		{
			throw "FAILED TO OPEN " + inpath;
		}
		
		var outdb = new TC.BDB;
		var outpath = this.path() + "_compact";
		try { fs.unlinkSync(outpath); } catch(e) {}
		
		if (!outdb.open(outpath, TC.BDB.OWRITER | TC.BDB.OCREAT))
		{
			throw "FAILED TO OPEN " + outpath;
		}
		
		var inCursor = new TC.BDBCUR(indb);
		inCursor.first();
		
		writeln("compacting");
		var copyCount = 0;
		while (true)
		{
			var k = inCursor.key();
			if(!k) break;
			var v = inCursor.val();
			outdb.put(k, v);
			inCursor.next();
			copyCount ++;
			if(copyCount % 50000 == 0) 
			{
				writeln("copied ", copyCount, " keys");
				//outdb.sync();
			}
		}
		writeln("copying done, writing file");
		
		indb.close();
		outdb.close();
		writeln("replacing db with compacted file");
		fs.renameSync(outpath, inpath);
		
		this.open();
		
		return true;
	}
})//.profileMethods("at", "atPut", "commit");
