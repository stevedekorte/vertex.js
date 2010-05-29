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
	
	
		
		var t1 = new Date().getTime()
		var pdb = this.newPdb().open()
		var aNode = pdb.root().mk("a")
		pdb.begin()
		for(var i = 0; i < max; i ++)
		{
			pdb._tc.put(new String(i), "x")
		}
		pdb.commit()
		pdb.close()
		var t2 = new Date().getTime()
		var dt = (t2 - t1)/1000		
		//writeln(max + " writes in " + dt + " seconds")		
		writeln("  " + Math.floor(max/dt) + " tc.puts per second")


		var t1 = new Date().getTime()
		var pdb = this.newPdb().open()
		var aNode = pdb.root().mk("a")
		pdb.begin()
		for(var i = 0; i < max; i ++)
		{
			pdb.atPut(new String(i), "x")
		}
		pdb.commit()
		pdb.close()
		var t2 = new Date().getTime()
		var dt = (t2 - t1)/1000		
		//writeln(max + " writes in " + dt + " seconds")		
		writeln("  " + Math.floor(max/dt) + " pdb.atPuts per second")

		
		/*
		// BIG INSERT
		
		max = 50000000
		writeln("  performing " , Math.floor(max/1000000), "M puts:")
		var t1 = new Date().getTime();
		var t2;
		var dt;
		pdb.open()
		//var pdb = this.newPdb().open()
		var aNode = pdb.root().mk("a")
		var count = 0
		for(var i = 1; i < max; i ++)
		{
			var k = new String(i);
			pdb._tc.put(k, "oncwjn,khszdfuhrhbfkdvjiohesjzbvjknlsdkndkjnfsdjkn9023djkwn23b8wdeub23sfd87g3bnfsd89ui3bksfdihw3buds")

			if (i % (2000000) == 0)
			{
				t2 = new Date().getTime()
				dt = (t2 - t1)/1000	
				t1 = t2;	
				writeln("    ", i/1000000, "M records, " + Math.floor(pdb.sizeInBytes()/1000000) + "Mb db " + Math.floor(count/dt) + " puts/sec")
				count = 0
			}
			count = count + 1
		}
		pdb.close()
		*/
	}

}).clone().runSilent()
