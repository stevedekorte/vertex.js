
Collector = Proto.clone().newSlots({
	protoType: "Collector",
	pdb: null,
	mode: null,
	stepSeconds: .1,
	sweepCursor: null,
	t1: null,
	highWaterMark: 0,
	lastStartDate: null,
	lastEndDate: null,
	markCursor: null,
	markCount: 0
	//actionQueue: null // add later to make marking incremental within a node
}).setSlots({

	setPdb: function(pdb)
	{
		this._pdb = pdb
		this._sweepCursor = this._pdb.newCursor()
		return this
	},

	needsIdle: function()
	{
		return (this.isRunning() == true || this.aboveHighWaterMark());
	},

	resetHighWaterMark: function()
	{
		this._highWaterMark = this._pdb.sizeInBytes() * 1.1
	},

	aboveHighWaterMark: function()
	{
		return this._pdb.sizeInBytes() > this._highWaterMark 
	},

	isRunning: function()
	{
		return this._mode != null
	},

	startTimer: function()
	{
		this._t1 = new Date().getTime()
	},

	timerDt: function()
	{
		return new Date().getTime() - this._t1;
	},
	
	hasTime: function()
	{
		if(this._stepSeconds == 0) 
		{
			return true
		}
		
		return new Date().getTime() - this._t1 < (this._stepSeconds * 1000);
	},

	idle: function(dt)
	{
		if(dt) 
		{
			this.setStepSeconds(dt)
		}
		
		this.step();
	},

	start: function()
	{
		this._mode = "mark"
		this._pidsToMark = Object_emptyObject()
		this._pidsToMark["0"] = 1
		this._pidsToMarkList = ["0"]
		this._markedPids = Object_emptyObject()
		this.setLastStartDate(new Date())
		this.setLastEndDate(null)
	},

	step: function()
	{
		if (this._mode == null)
		{
			this.start()
		}
		else 
		{
			this.startTimer()
	
			while (this.hasTime()) 
			{	
				if (this._mode == "mark") 
				{
					this.mark()	
				} 
				else if (this._mode == "sweep") 
				{
					this.sweep()
					break
				}
			}
		}
	},

	addPidToBeMarked: function(pid)
	{
		// this is how we avoid collecting stuff created during the collection process
		
		if (this._mode == "sweep") 
		{
			this._markedPids[pid] = 1
		} 
		else if (this._markedPids[pid] == null)
		{
			this._pidsToMark[pid] = 1
			this._pidsToMarkList.push(pid)
			//this._pidsToMarkList.unshift(pid) // avoids marking hot nodes until last?
		}
	},

	mark: function()
	{
		var maxKeyMarks = 1000;
		var keysMarkedCount = 0;
		
		if(!this.markCursor())
		{
			var pid = this._pidsToMarkList.pop()
			delete this._pidsToMark[pid];
			//if(this._markCount % 10000 == 0) require('util').debug("mark " + pid + " " + this._pidsToMarkList.length);
			this._markCount ++;
					
			if (!pid)
			{
				//require('util').debug("no pid sweepStart");
				this._pidsToMark = null;
				this.sweepStart();
				return null;
			}
	
			this.setMarkCursor(this._pdb.nodeForPid(pid).slotCursor());
			//require('util').debug("new cursor " + pid);
			this.markCursor().first();
			this._markedPids[pid] = pid; 
		}
		
		var c = this.markCursor();

		while (true)  
		{
			var k = c.key();
			if(!k) break;
			
			if(keysMarkedCount == maxKeyMarks) 
			{
				return false;
			}
							
			this.addPidToBeMarked(c.value());
			keysMarkedCount ++;
			c.next();

		}
		//require('util').debug("end mark  on " + pid);

		this.setMarkCursor(null);
		return true;
	},
	
	
	/*
	atomicMark: function()
	{
		var pid = this._pidsToMarkList.pop()
		this._markCount ++;
		if(this._markCount % 10000 == 0) require('util').debug("m " + pid + " " + this._pidsToMarkList.length);
		
		if (pid == null)
		{
			this._pidsToMark = null
			this.sweepStart()
			return null
		}
	
		this._markedPids[pid] = pid
		var node = this._pdb.nodeForPid(pid)
		var c = node.sRecord().cursor()
				
		// still need to make this loop incremental 
		c.first()
		while (c.key() != null)  
		{
			//require('util').debug("  " + node.pid() + " " + c.key() + ": " + c.value());
			this.addPidToBeMarked(c.value())
			c.next()
		}
		delete this._pidsToMark[pid]
	},
	*/
	
	sweepStart: function()
	{
		this._mode = "sweep"
		this._sweepCursor.first()
	},

	sweep: function()
	{
		var c = this._sweepCursor;
		var sweepCount = 0;
		
		this._pdb.begin()
		// incremental sweep
		while (this.hasTime()) 
		{
			var k = c.key();
			if(!k) break;
			var pid = k.slice(0, k.indexOf("/"))
			if (this._markedPids[pid] == null) 
			{
				this._pdb.willRemovePid(pid);
				c.out()
				sweepCount ++;
				//if(sweepCount % 1000 == 0 )require('util').debug("sweepCount " + sweepCount);
				//removeCount = removeCount + 1
			}
			else
			{
				c.next()
			}
		}
		this._pdb.commit()
		//writeln("sweep count ", sweepCount);
	
		if (c.key() == null) 
		{
			this.sweepEnd()
		}
	},

	sweepEnd: function()
	{
		//writeln("marked count ", Object_slotCount(this._markedPids));
		this._markedPids = null
		this._pidsToMark = null
		this._isCollecting = false
		this._mode = null
		this.resetHighWaterMark()
		this.setLastEndDate(new Date())
	},
	
	forceFullCollection: function()
	{
		var secs = this.stepSeconds()
		this.setStepSeconds(0)
		this.step() // starts the collector
		this.step() // starts marking - mark and sweep will finish since step seconds is zero
		this.setStepSeconds(secs)
		this.pdb().compact();
	}	
})
