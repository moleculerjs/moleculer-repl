const parse = require("yargs-parser");

module.exports = function (program, broker) {
	program
		.command("call <actionName> [jsonParams] [meta]")
		//.description("Call an Action")
		.option("--load [filename]", "Load params from file")
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			// Parse the args
			const [actionName, ...args] = thisCommand.args;
			let parsedArgs = { ...parse(args), ...thisCommand._optionValues };
			//let parsedArgs = thisCommand._optionValues;
			delete parsedArgs._;

			// console.log(thisCommand);

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				actionName,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			// Get the params
			const args = this.params;

			console.log(args);

			try {
				const result = await broker.call(args.actionName, args.options);
				console.log(result);
			} catch (error) {
				// console.log(error);
			}

			// Clear parsed values
			this._optionValues = {};
		});
};
