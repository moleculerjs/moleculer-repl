"use strict";

const util 	= require("util");

module.exports = function(vorpal) {
	// Print process.env
	vorpal
		.removeIfExist("env")
		.command("env", "List of environment variables")
		.action((args, done) => {
			console.log(util.inspect(process.env, { showHidden: false, depth: 4, colors: true }));
			done();
		});
};
