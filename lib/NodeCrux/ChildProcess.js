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
		p.stdout.on("data", function(data){
			self.setStdout(self.stdout() + data);
		});
		p.stderr.on("data", function(data){
			self.setStderr(self.stderr() + data);
		});
		p.on("exit", function(exitCode){
			self.setExitCode(exitCode);
			self.sendDelegates("exited");
			if(exitCode)
			{
				self.sendDelegates("exitedAbnormally");
			}
			else
			{
				self.sendDelegates("exitedNormally");
			}
		});
		
		
		this.setProcess(p);
	},
	
	write: function(str)
	{
		this.process().stdin.write(str);
		return this;
	}
});