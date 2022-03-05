/// <reference types="node" />
export = REPL;
/**
 * @typedef CommandOptions
 * @property {String} option
 * @property {String} description
 */
/**
 * @typedef CustomCommand
 * @property {String?} description
 * @property {Array<String> | String} alias
 * @property {Boolean} allowUnknownOptions
 * @property {Function} parse Custom params parser
 * @property {Array<CommandOptions>}
 * @property {Function} action Custom command handler
 */
/**
 * @typedef ReplOptions
 * @property {String?} delimiter
 * @property {Array<CustomCommand>|CustomCommand}
 */
/**
 * Start REPL mode
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @param {ReplOptions} opts
 */
declare function REPL(broker: import("moleculer").ServiceBroker, opts: ReplOptions): nodeRepl.REPLServer;
declare namespace REPL {
    export { CommandOptions, CustomCommand, ReplOptions };
}
type ReplOptions = {
    delimiter: string | null;
    "": Array<CustomCommand> | CustomCommand;
};
import nodeRepl = require("repl");
type CommandOptions = {
    option: string;
    description: string;
};
type CustomCommand = {
    description: string | null;
    alias: Array<string> | string;
    allowUnknownOptions: boolean;
    /**
     * Custom params parser
     */
    parse: Function;
    "": Array<CommandOptions>;
    /**
     * Custom command handler
     */
    action: Function;
};
