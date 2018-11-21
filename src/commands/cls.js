"use strict";

module.exports = function(vorpal) {
	vorpal
		.command("cls", "Clear console")
		.action((args, done) => {
			process.stdout.write("\x1Bc");
			done();
		});
};
