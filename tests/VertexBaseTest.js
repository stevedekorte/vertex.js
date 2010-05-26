require('./UnitTest');

VertexBaseTest = UnitTest.newSlots({
	protoType: "VertexBaseTest",
}).setSlots({
	
	/*	
	api_mk: function(path, optionalType, optionalData)
	api_link: function(destPath, slotName, sourcePath)
	api_ls: function(path, start, reverse, count, selectExpression)
	api_rm: function(path, slotName)
	api_mwrite: function(path, name, value)
	api_mread: function(path, name)
	api_mls: function(path)
	api_mrm: function(path, name)
	*/
	
	test_mk: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/bar"]
		])

		//writeln("r = ", r)
		//writeln("r.length = ", r.length)
		
		assert(r.length == 1)
		assert(r[0] == null)
		assert(v.node("foo/bar") != null)
		
		v.close()
	},
	
	test_link: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/bar/a"],
			["mk", "foo/moo"],
			["link", "foo/moo", "a", "foo/bar/a"]
		])

		assert(r.length == 3)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		assert(v.node("foo/bar/a").pid() == v.node("foo/moo/a").pid())
		
		v.close()		
	},
	
	test_ls: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/a"],
			["mk", "foo/b"],
			["mk", "foo/c"],
			["ls", "foo"]
		])

		assert(r.length == 4)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		//writeln("r[3] == ", r[3])
		assert(r[3].isEqual(["a", "b", "c"]))

		v.close()
	},

	test_mwrite: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/name"],
			["mwrite", "foo/name", "type", "String"],
			["mwrite", "foo/name", "data", "Joe Blow"]
		])

		assert(r.length == 3)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		assert(v.node("foo/name").mread("type") == "String")
		assert(v.node("foo/name").mread("data") == "Joe Blow")
			
		v.close()
	},

	test_mls: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/name"],
			["mwrite", "foo/name", "type", "String"],
			["mwrite", "foo/name", "data", "Joe Blow"],
			["mls", "foo/name"]
		])

		assert(r.length == 4)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		//writeln("r[3] = ", r[3])
		assert(r[3].isEqual(["data", "size", "type"]))
			
		v.close()
	},
	
	test_mread: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/name"],
			["mwrite", "foo/name", "type", "String"],
			["mwrite", "foo/name", "data", "Joe Blow"],
			["mread", "foo/name", "type"],
			["mread", "foo/name", "data"]
		])

		assert(r.length == 5)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		assert(r[3] == "String")
		assert(r[4] == "Joe Blow")
			
		v.close()
	},	
	
	test_mrm: function()
	{
		var v = Vertex.clone().vanish().open()

		var r = v.handleRequestItems([
			["mk", "foo/name"],
			["mwrite", "foo/name", "type", "String"],
			["mwrite", "foo/name", "data", "Joe Blow"],
			["mrm", "foo/name", "type"],
			["mls", "foo/name"]
		])

		assert(r.length == 5)
		assert(r[0] == null)
		assert(r[1] == null)
		assert(r[2] == null)
		assert(r[3] == null)
		assert(r[4].isEqual(["data", "size"]))
			
		v.close()		
	}
}).clone().run()
