/// <reference types="node" />
export = REPL;
/**
 * Start REPL mode
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @param {REPLOptions} opts
 */
declare function REPL(broker: import("moleculer").ServiceBroker, opts: REPLOptions): nodeRepl.REPLServer;
declare namespace REPL {
    export { CommandOptions, CustomCommand, REPLOptions };
}
/**
 * REPL Options
 */
type REPLOptions = {
    /**
     * REPL delimiter
     */
    delimiter: string | null;
    /**
     * Custom commands
     */
    customCommands: Array<CustomCommand> | CustomCommand;
};
import nodeRepl = require("repl");
type CommandOptions = {
    /**
     * Command option. More info: https://github.com/tj/commander.js/#options
     */
    option: string;
    /**
     * Option description
     */
    description: string;
};
/**
 * Custom command definition
 */
type CustomCommand = {
    /**
     * Command description
     */
    description: string | null;
    /**
     * Command alias
     */
    alias: Array<string> | string;
    /**
     * Allow unknown command options
     */
    allowUnknownOptions: boolean;
    /**
     * Custom params parser
     */
    parse: Function;
    /**
     * Command options
     */
    options: Array<CommandOptions>;
    /**
     * Custom command handler
     */
    action: Function;
};
