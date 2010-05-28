
ABOUT
-----

vertex.js is a high performance graph database inspired by filesystems that supports automatic garbage collection and is built on node.js and tokyocabinet. It uses HTTP as it's communication protocol and JSON as it's request and response data format. It's MIT licensed and was written by Steve Dekorte and Rich Collins. 


INSTALL AND RUN
---------------

1) if absent, install node.js 
2) in the vertex.js folder, run:

	node server.js

   Run "node server.js -help" for a list of command line options.

DATABASE STRUCTURE
------------------

The database is composed of nodes each of which have a lexically ordered list of named slots whose values point to other nodes and a separate list of meta slots whose values contain data. These lists are indexed (log(n) lookups) and support cursor-like operations so they can be use for most database applications.

This is similar to a typical filesystem except directories (the equivalent of vertex's "nodes") contain separate namespaces for sub-directories ("slots") and files ("meta slots").


META-SLOT CONVENTIONS
---------------------

By convention the meta slots "type" and "data" are used to indicate the node's type and to store raw data associated with it. Only primitive nodes types (such as String, Number, etc) should contain data values. The meta slot names "_user", "_permissions" and "_access" are reserved for future use.


GARBAGE COLLECTION
------------------

When the database grows above it's highwater mark (10% larger than when it was started) a garbage collection cycle begins which uses bits of server idle time to do incremental collection (both mark and sweep stages are incremental). When complete, non-referenced nodes are deleted.


REQUESTS, RESPONSES AND TRANSACTIONS
------------------------------------

API requests are sent as HTTP POST messages with the content type of "application/json-request". The JSON request is a list of actions and each action is a list containing the name of the action and it's arguments. Responses are a list with an item (containing the results) for each of the actions in the request. Actions that have no responses typically return null. 

Each request is processed within a transaction and if any action in a request produces an error, no further actions are processed and any writes that were made within the request are aborted (not committed to the database). The HTTP response will have a 500 status and a description of the action that caused the error and the reason for the error.


SAMPLE REQUEST
--------------

	POST /
	Content-Type: application/json-request
	Content-Length: X

	[
		["mk", "customers/John Doe/first name", "String", "John"],
		["mread", "customers/John Doe/first name"]
	]


SUCCESS RESPONSE
----------------

	Content-Type: application/json
	Content-Length: X
	Status-Code: 200

	[
		null,
		"John",
	]


ERROR RESPONSE
--------------

	Content-Type: application/json
	Content-Length: X
	Status-Code: 500

	{
		action: ["mwrite", "customers/Joe Shmoe/first name"],
		message: "invalid path"
	}


ERROR CONDITIONS
----------------

Errors are only raised when the database would be left in an undesired state. So removes never raise errors and reads return null if the path is absent. Writes and links do raise an error if the path does not exists unless an option to create the path is used.


API ACTIONS
-----------

	mk(path, optionalType, optionalData)
	link(destPath, slotName, sourcePath)
	ls(path, optionalStart, optionalReverse, optionalCount, optionalSelectExpression)
	rm(path, slotName)
	mwrite(path, name, value)
	mread(path, name)
	mls(path)
	mrm(path, name)


API ACTION DESCRIPTIONS
-----------------------

Where not otherwise stated, all arguments are assumed to be strings. 
Boolean values treat null for false and non-null (1 is recommended) for true.

mk(path, optionalType, optionalData)

	Writes: Create a node at path (creating any necessary path components 
		to that path). No change is made if the node is already present.
	Options:
		optionalType: if provided, the node's "type" meta slot is set to the value.
		optionalData: if provided, the node's "data" meta slot is set to the value.
	Errors: none
	Returns: null


link(destPath, slotName, sourcePath)

	Writes: At destPath, add a slot with named slotName that points to the node at sourcePath.
	Errors: An error occurs if either node does not already exist.
	Returns: null


ls(path, optionalMaxNumber, optionalStart, optionalReverseBool, optionalReturnCount, optionalInlineBool, selectExpression)

	Writes: none
	Returns: a list of slot names at path.
	Options:
		optionalStart: if given, the list starts at the first (or last, if 
			optionalReverse is not null) key matching or after the optionalStart string. 
		optionalReverseBool: if not null, the enumeration occurs in reverse order.
		optionalMaxNumber: if specified, limits the max number of returned results.
		optionalReturnCount: Return only the count of the result list, and not the items themselves.
		optionalInlineBool: [not yet implemented] if non-null, instead of each item 
			being a slot name, it will be a list containing the slot name and a json 
			object with the inlined values for primitive types such as strings and numbers.

			Inline example. The Database node (meta slot names here are denoted with underscores):

			{ 
				"first name": { "_type": "String", "_data": "John" }, 
				"age":  { "_type": "Number", "_data": "30" }, 
			}

			Would be inlined as:

			{
				["John Doe", { "first name": "John", "age": 30 }]
			}

		selectExpression: [not yet implemented] a string which will be evaled to a function 
			used to select the matching results.
	Errors: none



rm(path, slotName)

	Writes: Removes the slot named slotName on the node at path.
	Errors: none
	Returns: null
	

mwrite(path, name, value)

	Writes: At path, set/overwrite the meta slot named name to value.
	Errors: Raises error if the path does not exist.
	Returns: null


mread(path, name)

	Writes: none
	Errors: none
	Returns: a string containing the value of meta slot named name at path 
		or null if the path does not exist or slot is not present.
	

mls(path)

	Writes: none
	Errors: Raises error if path does not exists.
	Returns: a list of the meta slot names at path.


mrm(path, name)

	Writes: Removes the meta slot named name at path. 
	Errors: none
	Returns: null


TODO 
----

Security: 
	node permissions and cookies
	db internal node /_internal/users/username/passwordhash

Tests: 
	single script to run all tests
	run on separate port
	performance tests report




