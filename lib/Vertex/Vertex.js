var http = require('http');
var fs = require('fs');

require("./Log");
require("./Timer");
require("./IdleMonitor");
require("./AddonLoader");
require("./Collector");
require("./PNode");
require("./PCursor");
require("./PDB");
require("./PRecord");
require("./PUser");

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
	syncTimerDate: null,
	user: null,
	currentRequest: null,
	currentResponse: null,
	verbose: false,
	addons: null
}).setSlots({
	init: function()
	{
		this._pdb = PDB.clone()
		this.setDelegates([]);
		var self = this;
		this.setIdleTimer(
			Timer.clone().setDt(.1).setCallback(function () { self.idleTimerCallback(); })
		)
		this.setUser(PUser.clone()).setPdb(this._pdb);
		this.setAddons([]);
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
		writeln("");
		writeln("vertex.js:");
		writeln("  database: ", this.path());
		writeln("  port:     ", this.port());
		writeln("  status:   ready\n");

		this.open();

		this.setAddons(AddonLoader.loadAddons());
		for (var i = 0; i < this.addons().length; i ++)
		{
			var addon = this.addons()[i];
			addon.setVertex(this);
		}
		
		var delegate = this.delegate();
		if(delegate)
		{
			if(delegate.respondsTo("vertexWillStart"))
			{
				delegate.vertexWillStart(this);
			}
		}
		
		//this.setLastReqTime(new Date().getTime());
		
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
		
		this.setIsRunning(true);
	},

	open: function()
	{
		this.pdb().setPath(this.path()).open();
		return this;
	},

	close: function()
	{
		this._pdb.commit();
		this._pdb.close();
		return this;
	},

	handleRequest: function(request, response)
	{
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
				if(this._verbose) writeln("\nreceived: '" + request.body + "'");
				self.simpleHandleRequest(request, response);
			});
		}
		catch(e)
		{
			response.writeError(e);
			//response.end();
		}
	},
	
	writeErrorOnResponse: function(e, response)
	{		
		//writeln("ERROR: " + JSON.stringify(e));
		this.writeResultOnResponseWithStatus(e, response, 500);
	},
	
	writeResultOnResponseWithStatus: function(results, response, status)
	{
		//if(this._verbose) writeln("sending: " + status + "'" + results + "'");
		var body = JSON.stringify(results);
		
		if(results.stack)
		{
			if(this._verbose) writeln(results.stack);
			var lines = results.stack.split("\n");
			body = "<body style='margin-left:7em; margin-top:6em; line-height:1.5em;'>"
			body = body + "" + "<font color=#c00>" + lines.removeAt(0) + "</font><p>";
			body = body + "<div style='padding-left:3em'>";
			
			var calls = lines.map(
				function (s) 
				{ 
					var s = s.after("at ");
					if(s && s.contains("("))
					{
						var place = s.before(" (");
						var obj = place.before(".");
						var method = place.after(".");
						var rest = s.after(" (");
						var path = rest.before(":").pathComponents().last();
						var line = rest.after(":").before(":");
						//return { place: place.replace("\.", " "), path:path, line: line}; 
						if ({"events.js":true, "http.js":true, "net.js":true}[path] || method == "<anonymous>") return "";
						//return "<tr><td>" + path.before(".") + "</td><td>" + method + "&nbsp;&nbsp;</td><td align=right>" + path + "</td><td>" + line + "</td></tr>"; 
						var filePath = rest.before(":");
						filePath = "txmt://open/?url=file://" + filePath + "&line=" + line //"&column=" + column
						
						return "<tr onmouseover=\"style.backgroundColor='#ddd';\" onmouseout=\"style.backgroundColor='#fff';\" onclick=\"window.location = '" + filePath + "'\"><td align=right><font color=#999>" + line + "&nbsp;&nbsp;</td><td>" + path.before(".") + "&nbsp;&nbsp;</td><td>" + method + "&nbsp;&nbsp;</td></tr>"; 

					}
					return "";
				}
			);
			
			body = body + "<table cellspacing=0 border=0 cellpadding=2>" + calls.join("\n") + "</table>";
			body = body + "</div>";
		
		}
		//body = body.replaceSeq("\\n", "<br>");
		//body = "<html><body><pre>" + body + "</body></html>";

		response.writeHead(status, 
			{ 
				//"Content-Type": "application/json; charset=utf-8",
				"Content-Type": "text/html; charset=utf-8",
				"Content-Length": Buffer.byteLength(body.toString(), "utf8")
			}
		);
		response.write(body);
		response.end();
		if(this._verbose) writeln("sending: " + status + " '" + body + "'");
	},
	
	simpleHandleRequest: function(request, response)
	{	
		var startDate = new Date;
		request.info = require('url').parse(request.url);
		if(request.info.query)
		{
			request.query = require('querystring').parse(request.info.query);
		}
		else
		{
			request.query = {};
		}
		
		var cookies = {};
		if(request.headers.cookie)
		{
			request.headers.cookie.split(';').forEach(
				function( cookie ) 
				{
					var parts = cookie.split('=');
					cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
				}
			);
		}
		
		request.cookies = cookies;
		
		try
		{
			this.user().clear().setPdb(this._pdb);

			if (request.headers['cookie'])
			{
				this.user().setCookieHeader(request.headers['cookie']);
			}
		}
		catch (e)
		{
			writeln("error parsing cookie: " + e);
		}

		this.setCurrentRequest(request);
		this.setCurrentResponse(response);
		this._requestCount = this._requestCount + 1;


		var requestWasHandled = false;

		//writeln(JSON.stringify(request.cookies));
		if(!request.cookies["ignoreAddons"])
		{
			try 
			{
				for (var i = 0; i < this.addons().length; i ++)
				{
					var addon = this.addons()[i];
					// writeln("addon " + i + " " + addon.protoType());

					if(addon.canHandleRequest(request))
					{
						this._pdb.begin();
						if(addon.handleRequest(request, response))
						{
							requestWasHandled = true;
							//writeln("HANDLED")
							this._pdb.commit();
							break;
						}
					}	
				}
			}
			catch(e)
			{
				writeln("ADDON ERROR: " + e.message);
				this.writeErrorOnResponse(e, response);
				return;
			}
		}

		if (!requestWasHandled)
		{
			if(request.body == null)
			{
				this.writeErrorOnResponse("no json found in request", response);
				return;
			}

			try
			{
				//writeln(request.body);
				var requestItems = JSON.parse(request.body);
			}
			catch(e)
			{
				//writeln("PARSE ERROR");
				this.writeErrorOnResponse(e, response);
				return;
			}

			this._pdb.begin();

			var results;

			try
			{
				results = this.handleRequestItems(requestItems);
			}
			catch(e)
			{
				//writeln("HANDLE ERROR")
				this._pdb.abort();
				this.writeErrorOnResponse(e, response);
				return;
			}

			this.writeResultOnResponseWithStatus(results, response, 200);
		}

		this.setCurrentRequest(null);
		this.setCurrentResponse(null);

		this.updateIdleTimerIfNeeded();
		
		//Log.writeln(new Date().getTime() - startDate.getTime() + "ms", request.url);
	},

	
	handleRequestItemsWithinCommmit: function(requestItems)
	{
		this._pdb.begin();
		var results = this.handleRequestItems(requestItems);
		this._pdb.commit();
		return results;
	},
	
	updateIdleTimerIfNeeded: function()
	{
		if(this._pdb.needsIdle())
		{
			this.idleTimer().start();
		}
		else
		{
			this.idleTimer().stop();
		}	
	},
	
	idleTimerCallback: function()
	{
		this._pdb.idle();
		this.updateIdleTimerIfNeeded()
	},
	
	handleRequestItems: function(requestItems)
	{
		var results = [];
		//writeln("requestItems = ", requestItems);
		for (var i = 0; i < requestItems.length; i ++)
		{			
			var item = requestItems[i];
			
			if(this._verbose) { writeln("  ITEM: ", item); }
			
			try
			{
				var name = item[0];
				var result = null;
				var methodName = "api_" + name;
			
				if(this[methodName] != null)
				{
					if(item.length == 1)
					{
						result = this.perform(methodName)
					}
					else
					{
						result = this.performWithArgs(methodName, item.slice(1));
					}
				}
				else
				{
					if(this._verbose)  { writeln("ERROR: INVALID API '" + methodName + "'"); }
					throw {message: 'invalid api method ' + methodName};
				}
			}
			catch (e)
			{	
				if(true) //(this._verbose) 
				{
					writeln("\n");
					//writeln("  ERROR: '", JSON.stringify(e), "'");
					writeln("  ERROR: '", e.message, "'");
					writeln("  HANDLING ACTION: ", item);
					
					if(e.stack) 
					{
						writeln("  STACK: ", e.stack);
					}
					else
					{
						writeln("  NO STACK TRACE");
					}
					
					writeln("\n");
				}
				
				throw  {message: e.message, action: item, actionIndex: i, request: requestItems}
			}
			results.push(result);
		}
		
		return results;
	},

	idle: function()
	{
		this._pdb.idle();
	},

	show: function()
	{
		writeln("Vertex:");
		this.pdb().show();
	},
	
	vanish: function()
	{
		this.close();
		try 
		{ 
			fs.unlinkSync(this.path()); 
			fs.unlinkSync(this.path() + ".wal"); 
		} 
		catch(e) 
		{
		}
		
		this.pdb().vanish();
		return this;
	},
	
	rootNode: function()
	{
		return this._pdb.rootPNode();;
	},
	
	node: function(path)
	{
		return this._pdb.rootPNode().nodeAtPath(path, this.user());
	},
	
	/*
	writableNode: function(path)
	{
		return this._pdb.rootPNode().nodeAtPath(path);
	},
	
	readableNode: function(path)
	{
		return this._pdb.rootPNode().nodeAtPath(path);
	},
	*/
	
	validNode: function(path)
	{	
		var n = this.node(path, this.user());
		if(n == null)
		{
			throw {message: "invalid path"}
		}
		return n;
	},

	// API ---------------------------------
	
	api_mk: function(path, optionalType, optionalData)
	{
		//writeln("api_mk " + path + " USER: '" + this.user().username(), ":" + this.user().password() + "' valid: " +  this.user().isValid());
	    var newPNode = this._pdb.rootPNode().createPNodeAtPath(path.removePrefix("/"), this.user());
	
		if (newPNode) 
		{
			if (optionalType) 
			{
				newPNode.setType(optionalType);
			}
			
			if (optionalData) 
			{ 
				newPNode.setData(optionalData);
			}
		}

		return null;
	},

	api_link: function(destPath, slotName, sourcePath)
	{
		var destNode = this.validNode(destPath.removePrefix("/"));
		var sourceNode = this.validNode(sourcePath.removePrefix("/"));

		if (!destNode.isWritableByUser(this.user()))
		{
			throw new Error("invalid write permissions")
		}
		
		destNode.link(slotName, sourceNode);
		return null;
	},
	
	api_ls: function(path, max, start, reverse, returnCount, optionalInlineBool, selectExpression)
	{
		//var expressionFunc = eval(selectExpression);
		var destNode = this.node(path.removePrefix("/"));
		if(destNode == null)
		{
			return null;
		}
			
		var c = destNode.sRecord().cursor();
		
		if(reverse) 
		{
			c.last();
		}
		else
		{
			c.first();
		}
			
		if(start) 
		{
			c.jump(start);
		}
		
		var results = [];
		
		while (c.key() && (max == null || max > 0))
		{
			//if(expressionFunc(c.nodeValue()))
			//{
				var result = [c.key()];
				if (optionalInlineBool)
				{
					var inlinedNode = destNode.at(c.key());
					result.push(inlinedNode.asJsonObject());
				}
				else
				{
					result = c.key();
				}
				
				results.push(result);
				
				if(max) max = max - 1;
			//}
			
			if(reverse)
			{
				c.prev();
			}
			else
			{
				c.next();
			}
			
		} 
		
		if(returnCount) return results.length;
		return results;
	},
	
	api_obj: function(path)
	{
		var destNode = this.node(path.removePrefix("/"));
		if(destNode == null)
		{
			return null;
		}
			
		return destNode.asJsonObject();
	},
	
	api_rm: function(path, slotName)
	{
		var destNode = this.node(path.removePrefix("/"));
		
		if(destNode == null)
		{
			return null;
		}
		
		if (!destNode.isWritableByUser(this.user()))
		{
			throw new Error("invalid write permissions")
		}
		
		destNode.rm(slotName);
		return null;
	},
	
	// meta API 
	
	api_mwrite: function(path, name, value)
	{
		var destNode = this.validNode(path.removePrefix("/"));
		if (!destNode.isWritableByUser(this.user()))
		{
			writeln("api_mwrite invalid write permissions");
			throw new Error("invalid write permissions");
		}
		destNode.mRecord().atPut(name, value);
		return null;
	},
	
	api_mread: function(path, name)
	{
		var destNode = this.node(path.removePrefix("/"));
		if(destNode == null)
		{
			return null;
		}
		
		return destNode.mRecord().at(name);
		return null;
	},
	
	api_mls: function(path)
	{
		var destNode = this.node(path.removePrefix("/"));
		if(destNode == null)
		{
			return null;
		}
		
		return destNode.mRecord().slotNames();
	},
	
	api_mrm: function(path, name)
	{
		var destNode = this.validNode(path.removePrefix("/"));
		if (!destNode.isWritableByUser(this.user()))
		{
			throw new Error("invalid write permissions");
		}
		destNode.mrm(name);
		return null;
	},
	
	api_vanish: function()
	{
		this.vanish().open();
		return null;
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
		
		return null;
	},
	
	syncTimerCallback: function()
	{
		this._syncTimer = null;
		this._syncTimerDate = null;
		this._pdb.commit();
	},

	/*
	api_login: function(userName, password)
	{
		var userNode = this.validNode("/_internal/users/" .. userName)
		
		if (!userNode)
		{
			throw new Error("no such user '" + userName + "'");
		}
		
		if(userNode.password() != password)
		{
			throw new Error("wrong password");
		}
		

		var req = this.currentRequest();
		var res = this.currentResponse();
		
		this.currentResponse().setSecureCookie("vertexkey", (Math.random()*1e9).toString(36));
	},
	*/
			
	api_dbinfo: function()
	{
		return {
			requestCount: this.requestCount(),
			sizeInBytes: this._pdb.sizeInBytes(),
			collector: {
				lastStartDate: this._pdb.collector().lastStartDate(),
				lastEndDate: this._pdb.collector().lastEndDate()
			}
		}
	},
	
	api_nop: function()
	{
		return null;
	}
})
