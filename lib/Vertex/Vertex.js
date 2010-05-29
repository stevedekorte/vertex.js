var http = require('http');
var fs = require('fs');

require("./Timer");
require("./IdleMonitor");
require("./AddonLoader");
require("./Collector");
require("./PNode");
require("./PCursor");
require("./PDB");
require("./PRecord");

Vertex = Proto.clone().newSlots({
	protoType: "Vertex",
	pdb: null,
	path: "db/vertex.vdb",
	delegates: [],
	port: 8000,
	delegate: null,
	lastReqTime: null,
	idleMonitor: null,
	timer: null,
	isRunning: false,
	idleTimer: null,
	requestCount: 0,
	syncTimerId: null,
	syncTimerDate: null
}).setSlots({
	init: function()
	{
		this._pdb = PDB.clone()
		this.setDelegates([]);
		var self = this;
		this.setIdleTimer(
			Timer.clone().setDt(.1).setCallback(function () { self.idleTimerCallback(); })
		)
		return this;
	},
	
	timer: function()
	{
		if(!this._timer)
		{
			this._timer = Timer.clone();
		}
		
		return this._timer;
	},

	start: function()
	{
		writeln("")
		writeln("vertex.js:")
		writeln("  database: ", this.path())
		writeln("  port:     ", this.port())
		writeln("  status:   ready")

		this.open();

		AddonLoader.loadAddons();
		var delegate = this.delegate();
		if(delegate)
		{
			if(delegate.respondsTo("vertexWillStart"))
			{
				delegate.vertexWillStart(this);
			}
		}
		
		this.setLastReqTime(new Date().getTime());
		
		var im = IdleMonitor.clone();
		im.setVertex(this);
		im.start();

		var self = this;
		http.createServer(function(request, response)
		{
			self.handleRequest(request, response);
		}).listen(this.port());
		
		process.addListener("exit", function()
		{
			this.pdb().close();
		});
		
		this.setIsRunning(true)
	},

	open: function()
	{
		this.pdb().setPath(this.path()).open();
		return this
	},

	close: function()
	{
		this._pdb.close()
		return this
	},

	root: function()
	{
		return this._pdb.root()
	},

	node: function(path)
	{
		return this._pdb.nodeAtPath(path)
	},	 

	handleRequest: function(request, response)
	{
		this.setLastReqTime(new Date().getTime());
		
		var delegate = this.delegate();
		if(delegate)
		{
			delegate.vertexHandleRequest(this, request, response);
			return
		}
		
		try
		{
			request.isGet = request.method.toLowerCase() == "get";

			request.addListener('data', function(data)
			{
				if(request["body"] === undefined)
				{
					request.body = "";
				}

				request.body = request.body + data;
			});

			var self = this;
			request.addListener('end', function()
			{
				self.simpleHandleRequest(request, response)
			});
		}
		catch(e)
		{
			response.writeError(e);
		}
	},
	
	writeErrorOnResponse: function(e, response)
	{		
		this.writeResultOnResponseWithStatus(e, response, 500)	
	},
	
	writeResultOnResponseWithStatus: function(results, response, status)
	{
		/*
		delete results.stack 
		delete results.arguments 
		delete results.type 
		*/

		var body = JSON.stringify(results)
		response.writeHead(status, 
			{ 
				"Content-Type": "text/html; charset=utf-8",
			    "Content-Length": body.length
			}
		);
		response.write(body)
		response.end()	
		//writeln("sent: ", body)
	},
	
	simpleHandleRequest: function(request, response)
	{
		this._requestCount = this._requestCount + 1
		//writeln("Vertex simpleHandleRequest body:'" + request.body + "'")

		/*
		if(true) // short circuit test
		{
			this.writeResultOnResponseWithStatus(null, response, 200)
			return
		}
		*/
		//writeln("received: ", request.body)
					
		if(request.body == null)
		{
			//writeln("BODY NULL ERROR")
			this.writeErrorOnResponse("no json found in request", response)
			return
		}
		
		try
		{
			var requestItems = JSON.parse(request.body)
		}
		catch(e)
		{
			//writeln("PARSE ERROR")
			this.writeErrorOnResponse(e, response)
			return
		}

		this._pdb.begin()

		var results;
		
		try
		{
			results = this.handleRequestItems(requestItems)
		}
		catch(e)
		{
			//writeln("HANDLE ERROR")
			this._pdb.abort()
			this.writeErrorOnResponse(e, response)
			return
		}
		
		this.writeResultOnResponseWithStatus(results, response, 200);
		
		this.updateIdleTimerIfNeeded();
	},
	
	handleRequestItemsWithinCommmit: function(requestItems)
	{
		this._pdb.begin()
		var results = this.handleRequestItems(requestItems)
		this._pdb.commit() 
		return results;
	},
	
	updateIdleTimerIfNeeded: function()
	{
		if(this._pdb.needsIdle())
		{
			//writeln("STARTING IDLE TIMER")
			this.idleTimer().start();
		}
		else
		{
			//writeln("STOPPING IDLE TIMER")
			this.idleTimer().stop();
		}	
	},
	
	idleTimerCallback: function()
	{
		//writeln("IDLE")
		this._pdb.idle();
		this.updateIdleTimerIfNeeded()
	},
	
	handleRequestItems: function(requestItems)
	{
		var results = []
		//writeln("requestItems = ", requestItems)
		for (var i = 0; i < requestItems.length; i ++)
		{			
			var item = requestItems[i]
			
			try
			{
				var name = item[0]
				var result = null
				var methodName = "api_" + name
			
				if(this[methodName] != null)
				{
					if(item.length == 1)
					{
						result = this.perform(methodName)
					}
					else
					{
						result = this.performWithArgs(methodName, item.slice(1))
					}
				}
				else
				{
					writeln("ERROR: INVALID API '" + methodName + "'")
					throw {message: 'invalid api method ' + methodName};
				}
			}
			catch (e)
			{	
				//writeln("\n HANDLE ERROR: ", JSON.stringify(e), "\n")
				throw  {message: e.message, action: item, actionIndex: i, request: requestItems}
			}

			results.push(result)
		}
				
		return results
	},

	idle: function()
	{
		this._pdb.idle()
	},


	show: function()
	{
		writeln("Vertex:")
		this.pdb().show()
	},
	
	vanish: function()
	{
		this.close();
		try 
		{ 
			fs.unlinkSync(this.path()); 
			fs.unlinkSync(this.path() + ".wal"); 
			writeln("this.path() = " + this.path())
		} 
		catch(e) 
		{
		}
		
		this.pdb().vanish()
		return this
	},
	
	validNode: function(path)
	{	
		var n = this.node(path)
		if(n == null)
		{
			throw {message: "invalid path"}
		}
		return n
	},

	// API ---------------------------------
	
	api_mk: function(path, optionalType, optionalData)
	{
	    var newPNode = this._pdb.createPNodeAtPath(path)
	
		if (newPNode) 
		{
			if (optionalType) 
			{
				newPNode.setType(optionalType) 
			}
			
			if (optionalData) 
			{ 
				newPNode.setData(optionalData) 
			}
		}

		return null
	},

	api_link: function(destPath, slotName, sourcePath)
	{
		var destNode = this.validNode(destPath)
		var sourceNode = this.validNode(sourcePath)
		destNode.link(slotName, sourceNode)
		return null
	},
	
	api_ls: function(path, max, start, reverse, returnCount, optionalInlineBool, selectExpression)
	{
		//var expressionFunc = eval(selectExpression)
		var destNode = this.node(path)
		if(destNode == null)
		{
			return null
		}
			
		var c = destNode.sRecord().cursor()
		
		if(reverse) 
		{
			c.last()
		}
		else
		{
			c.first()
		}
			
		if(start) 
		{
			c.jump(start)
		}
		
		var results = []
		
		while (c.key() && (max == null || max > 0))
		{
			//if(expressionFunc(c.nodeValue()))
			//{
				results.push(c.key())
				if(max) max = max - 1
			//}
			
			if(reverse)
			{
				c.prev()
			}
			else
			{
				c.next()
			}
			
		} 
		
		if(returnCount) return results.length
		return results		
	},
	
	api_rm: function(path, slotName)
	{
		var destNode = this.node(path)
		if(destNode == null)
		{
			return null
		}
		destNode.rm(slotName)
		return null
	},
	
	// meta API 
	
	api_mwrite: function(path, name, value)
	{
		var destNode = this.validNode(path)
		destNode.mRecord().atPut(name, value)
		return null
	},
	
	api_mread: function(path, name)
	{
		var destNode = this.node(path)
		if(destNode == null)
		{
			return null
		}
		
		return destNode.mRecord().at(name)
		return null		
	},
	
	api_mls: function(path)
	{
		var destNode = this.node(path)
		if(destNode == null)
		{
			return null
		}
		
		return destNode.mRecord().slotNames()
	},
	
	api_mrm: function(path, name)
	{
		var destNode = this.validNode(path)
		destNode.mrm(name)		
		return null		
	},
	
	api_vanish: function()
	{
		this.vanish().open()
		return null		
	},
	
	api_null: function()
	{
		return null		
	},

	api_sync: function(dt) // dt is in seconds
	{
		dt = new Number(dt);
		
		if(dt == 0)
		{
			this._pdb.commit()
		}
		else
		{
			var self = this;
			var ms = 1000 * dt;
			var d = new Date();
			d.setTime(d.getTime() + ms);
			
			if (this._syncTimerDate == null || d < this._syncTimerDate)
			{
				if (this._syncTimerId) 
				{
					clearTimeout(this._syncTimerId);
				}
				
				this._syncTimerDate = d;
				this._syncTimerId = setTimeout(function () { self.syncTimerCallback(); }, ms);
			}
		}
		
		return null		
	},
	
	syncTimerCallback: function()
	{
		this._syncTimer = null;
		this._syncTimerDate = null;
		this._pdb.commit();
	},
		
	api_dbinfo: function()
	{
		return {
			requestCount: this.requestCount(),
			sizeInBytes: this._pdb.sizeInBytes(),
			collector: {
				lastStartDate: this._pdb.collector().lastStartDate(),
				lastEndDate: this._pdb.collector().lastStartDate()
			}
		}
	}
})
