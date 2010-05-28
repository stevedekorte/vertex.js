require('../UnitTest')

PDBSpeedTest = UnitTest.newSlots({
	protoType: "PDBSpeedTest",
}).setSlots({
	
	newPdb: function()
	{
		return PDB.clone().setPath("test.db").vanish()
	},
	
	test_speed: function()
	{		
		var max = 1000

		var t1 = new Date().getTime()
		var pdb = this.newPdb().open()
		pdb.begin()
		var aNode = pdb.root().mk("a")
		for(var i = 0; i < max; i ++)
		{
			aNode.mk(new String(i))
		}
		pdb.commit()
		pdb.close()
		var t2 = new Date().getTime()
		var dt = (t2 - t1)/1000		
		//writeln(max + " writes in " + dt + " seconds")		
		writeln("  " + Math.floor(max/dt) + " sync group writes per second")
		
		
		var t1 = new Date().getTime()
		var pdb = this.newPdb().open()
		var aNode = pdb.root().mk("a")
		for(var i = 0; i < max; i ++)
		{
			pdb.begin()
			aNode.mk(new String(i))
			pdb.commit()
		}
		pdb.close()
		var t2 = new Date().getTime()
		var dt = (t2 - t1)/1000		
		//writeln(max + " writes in " + dt + " seconds")		
		writeln("  " + Math.floor(max/dt) + " individual sync writes per second")

		
		max = 100000
		var t1 = new Date().getTime()
		pdb.open()
		//var pdb = this.newPdb().open()
		var aNode = pdb.root().mk("a")
		for(var i = 0; i < max; i ++)
		{
			aNode.mread(new String(i))
		}
		pdb.close()
		var t2 = new Date().getTime()
		var dt = (t2 - t1)/1000		
		//writeln(max + " writes in " + dt + " seconds")		
		writeln("  " + Math.floor(max/dt) + " reads per second")

	}

}).clone().runSilent()
