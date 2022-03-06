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
    customCommands: Array<CustomCommand> | CustomCommand | null;
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
     * Command declaration
     */
    command: string;
    /**
     * Command description
     */
    description: string | null;
    /**
     * Command alias
     */
    alias: Array<string> | string | null;
    /**
     * Allow unknown command options
     */
    allowUnknownOptions: boolean | null;
    /**
     * Custom params parser
     */
    parse: Function | null;
    /**
     * Command options
     */
    options: Array<CommandOptions>;
    /**
     * Custom command handler
     */
    action: Function;
};

declare module "moleculer" {
    interface ServiceBroker {
        repl(opts?: Partial<REPLOptions>): nodeRepl.REPLServer;
    }

    interface BrokerOptions {
        /**
         * Custom command definition
         */
        replCommands?: Array<CustomCommand>;
        /**
         * REPL delimiter
         */
        replDelimiter?: string;
    }
}
