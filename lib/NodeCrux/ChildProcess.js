var spawn = require("child_process").spawn;

ChildProcess = Delegator.clone().newSlots({
	protoType: "ChildProcess",
	path: null,
	args: null,
	stdout: null,
	stderr: null,
	process: null,
	exitCode: null
}).setSlots({
	start: function()
	{
		var self = this;
		
		this.setStdout("");
		this.setStderr("");
		
		var p = require("child_process").spawn(this.path(), this.args());
		process.stdout.on("data", function(data){
			self.setStdout(self.stdout() + data);
		});
		process.stderr.on("data", function(data){
			self.setStderr(self.stderr() + data);
		});
		process.on("exit", function(exitCode){
			this.setExitCode(exitCode);
			this.sendDelegates("exited");
			if(exitCode)
			{
				this.sendDelegates("exitedAbnormally");
			}
			else
			{
				this.sendDelegates("exitedNormally");
			}
		});
		
		
		this.setProcess(p);
	},
	
	write: function(str)
	{
		this.stdin().write(str);
		return this;
	}
});