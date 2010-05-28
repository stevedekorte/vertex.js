
Collector = Proto.clone().newSlots({
	protoType: "Collector",
	pdb: null,
	mode: null,
	stepSeconds: .02,
	sweepCursor: null,
	t1: null,
	highWaterMark: 0
	//actionQueue: null // list of actions (mark, sweep) to perform
}).setSlots({

	setPdb: function(pdb)
	{
		this._pdb = pdb
		this._sweepCursor = this._pdb.newCursor()
		return this
	},

	needsIdle: function()
	{
		return (this.isRunning() == false && this.aboveHighWaterMark());
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
		this._pidsToMark[0] = 0
		this._markedPids = Object_emptyObject()
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
				/*
				writeln("step-" + this._mode)
				writeln("  self._pidsToMark: ", Object_slotCount(this._pidsToMark))
				writeln("  self._markedPids: ", Object_slotCount(this._markedPids))
				*/
				
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
		}
	},

	mark: function()
	{
		var pid = Object_popFirstKey(this._pidsToMark)
		
		if (pid == null)
		{
			this._pidsToMark = null
			this.sweepStart()
			return null
		}
	
		// still need to make this loop incremental 
		this._markedPids[pid] = pid
		var node = this._pdb.nodeForPid(pid)
		var c = node.sRecord().cursor()
		
		c.first()
		while (c.key())  
		{
			this.addPidToBeMarked(c.value())
			c.next()
		}
		delete this._pidsToMark[pid]
	},
	
	sweepStart: function()
	{
		this._mode = "sweep"
		this._sweepCursor.first()
	},

	sweep: function()
	{
		// still need to make this incremental
		var c = this._sweepCursor
	
		this._pdb.begin()
		while (c.key() && this.hasTime()) 
		{
			var k = c.key()
			var pid = k.slice(0, k.indexOf("/"))
			if (this._markedPids[pid] == null) 
			{
				c.out()
			}
			else
			{
				c.next()
			}
		}
		this._pdb.commit()
	
		if (c.key() == null) 
		{
			this.sweepEnd()
		}
	},

	sweepEnd: function()
	{
		this._markedPids = null
		this._pidsToMark = null
		this._isCollecting = false
		this._mode = null
		this.resetHighWaterMark()
	},
	
	forceFullCollection: function()
	{
		var secs = this.stepSeconds()
		this.setStepSeconds(0)
		this.step() // starts the collector
		this.step()
		this.setStepSeconds(secs)
	}
})
