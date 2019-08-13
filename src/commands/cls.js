"use strict";

module.exports = function(vorpal) {
	vorpal
		.removeIfExist("cls")
		.command("cls", "Clear console")
		.action((args, done) => {
			process.stdout.write("\x1Bc");
			done();
		});
};
