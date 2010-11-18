
Collector = Proto.clone().newSlots({
	protoType: "Collector",
	pdb: null,
	mode: null,
	stepSeconds: .1,
	sweepCursor: null,
	t1: null,
	highWaterMark: 0,
	lastStartDate: null,
	lastEndDate: null
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
			//this._pidsToMarkList.push(pid)
			this._pidsToMarkList.unshift(pid) // avoids marking hot nodes until last?
		}
	},

	mark: function()
	{
		var pid = this._pidsToMarkList.pop()
		
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
		var c = this._sweepCursor;
		//var removeCount = 0;
		
		this._pdb.begin()
		// incremental sweep
		while (c.key() && this.hasTime()) 
		{
			var k = c.key()
			var pid = k.slice(0, k.indexOf("/"))
			if (this._markedPids[pid] == null) 
			{
				this._pdb.willRemovePid(pid);
				c.out()
				//removeCount = removeCount + 1
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
		this.setLastEndDate(new Date())
	},
	
	forceFullCollection: function()
	{
		var secs = this.stepSeconds()
		this.setStepSeconds(0)
		this.step() // starts the collector
		this.step() // marking begins
		this.setStepSeconds(secs)
	}
})
