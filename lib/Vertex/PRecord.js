
PRecord = Proto.clone().newSlots({	
	protoType: "PRecord",
	pdb: null,
	prefix: null,
}).setSlots({
	fullKey: function(k) 
	{
		return this._prefix + k 
	},

	//-- hasKey/at/atPut/removeAt ---------------------------------------------------------------

	hasKey: function(k)
	{
		return (this.at(k) != null)
	},

	at: function(k)
	{
		return this._pdb.at(this.fullKey(k))
	},

	atPut: function(k, v)
	{
		this._pdb.atPut(this.fullKey(k), v.toString())
	},

	removeAt: function(k)
	{
		//writeln("PRecord.removeAt(" + k + ") " + this.fullKey(k))
		this._pdb.removeAt(this.fullKey(k))	
		return this
	},

/*
	zeroKey: function(k)
	{
		var fk = this.fullKey(k)
		this._pdb.removeAt(fk)
		return this._pdb.atIncrement(fk, 0)
	},

	incrementKey: function(k)
	{
		return this._pdb.atIncrement(this.fullKey(k), 1)
	},

	decrementKey: function(k)
	{
		return this._pdb.atIncrement(this.fullKey(k), -1)
	},
*/
	
	zeroKey: function(k)
	{
		var fk = this.fullKey(k)
		this._pdb.atPut(fk, "0")
		return 0
	},

	incrementKey: function(k)
	{
		var fk = this.fullKey(k)
		var v = new Number(this._pdb.at(fk))
		if (v == null) { v = 0 }
		v = v + 1
		this._pdb.atPut(fk, v.toString())
		return v
	},

	decrementKey: function(k)
	{
		var fk = this.fullKey(k)
		var v = new Number(this._pdb.at(fk))
		if (v == null) { v = 0 }
		v = v - 1
		this._pdb.atPut(fk, v.toString())
		return v
	},

	//-- cursor -----------------------------------------

	cursor: function()
	{
		return PCursor.clone().setPdb(this._pdb).setPrefix(this._prefix)
	},
	
	slotNames: function()
	{
		var names = []
		var c = this.cursor()
		c.first()
		while(c.key())
		{
			names.push(c.key())
			c.next()
		}
		return names
	}
})

