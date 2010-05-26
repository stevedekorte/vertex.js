require('./UnitTest')

/*
	TODO:
		add size tests
*/

Tester = UnitTest.newSlots({
	protoType: "PDBTest",
}).setSlots({
	
	newPdb: function()
	{
		return PDB.clone().setPath("test.pdb").vanish()
	},
	
	testOpenVanishAndExists: function()
	{
		var pdb = this.newPdb()
		assert(pdb.exists() == false)
		pdb.open()
		assert(pdb.exists() == true)
		pdb.close()
		pdb.vanish()
		assert(pdb.exists() == false)
	},
	
	testRoot: function()
	{
		var pdb = this.newPdb().open()
		var root = pdb.root()
		assert(root != null)
		assert(root.pid() == 0)
		assert(pdb.rawKeyCount() == 1)
		pdb.close()
	},

	testBeginCommit: function()
	{
		var pdb = this.newPdb().open()
		pdb.begin()
		pdb.atPut("123/m/", "y")
		pdb.commit()
		pdb.close()
		
		pdb.open()
		assert(pdb.at("123/m/") == "y")
		pdb.close()
	},
	
	testBeginAbort: function()
	{
		var pdb = this.newPdb().open()
		pdb.begin()
		pdb.atPut("123/m/", "y")
		pdb.abort()
		pdb.close()
		
		pdb.open()
		assert(pdb.at("x") == null)
		pdb.close()
	},
	
	testCursor: function()
	{
		var pdb = this.newPdb().open()
		var cur = pdb.newCursor()
		
		cur.first()
		//writeln("cusor.val() = ", cur.val())
		assert(cur.val() == "0")
		cur.next()
		assert(cur.val() == null)
		
		pdb.close()
	},
	
	testRemoveAt: function()
	{
		var pdb = this.newPdb().open()
		pdb.begin()
		pdb.atPut("123/m/", "y")
		pdb.commit()
		pdb.close()
		
		pdb.open()
		assert(pdb.at("123/m/") == "y")
		pdb.removeAt("123/m/")
		pdb.close()
		
		pdb.open()
		assert(pdb.at("123/m/") == null)
		pdb.close()
	},
	
	testSizeAt: function()
	{
		var pdb = this.newPdb().open()
		pdb.begin()
		pdb.atPut("123/m/", "1")
		assert(pdb.sizeAt("123/m/") == 1)
		pdb.atPut("123/m/", "123")
		assert(pdb.sizeAt("123/m/") == 3)
		pdb.close()
	},
	
	testAtAndAtPut: function()
	{
		var max = 10000;
		var pdb = this.newPdb().open()
		pdb.begin()
		for(var i = 0; i < max; i ++)
		{
			var k = new String(i)
			pdb.atPut(k, k)
		}
		pdb.commit()
		pdb.close()
		
		pdb.open()
		for(var i = 0; i < max; i ++)
		{
			var k = new String(i)
			assert(k == pdb.at(k))
		}
		pdb.close()		
	},
	
	testCollector: function()
	{		
		var max = 1000;
		var pdb = this.newPdb().open()
		
		pdb.begin()
		var aNode = pdb.root().mk("a")
		for(var i = 0; i < max; i ++)
		{
			aNode.mk(new String(i))
		}
		pdb.commit()
		pdb.root().rm("a")
		pdb.close()
		pdb.open()
		
		//writeln("pdb.rawKeyCount() = ", pdb.rawKeyCount())
		assert(pdb.rawKeyCount() > 1)
		pdb.collector().forceFullCollection()
		//pdb.showRawKeyValues()
		//writeln("after collect pdb.rawKeyCount() = ", pdb.rawKeyCount())
		//pdb.show()
		assert(pdb.rawKeyCount() == 1)
		pdb.close()
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
		writeln(Math.floor(max/dt) + " sync group writes per second")
		
		
		
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
		writeln(Math.floor(max/dt) + " individual sync writes per second")

		
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
		writeln(Math.floor(max/dt) + " reads per second")

	}

}).clone().run()
