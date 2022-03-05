/**
 * Given a line from terminal generates a list of suggestions
 *
 * @param {String} line
 * @param {import("moleculer").ServiceBroker} broker
 * @param {import('commander').Command} program
 * @returns {[String[], String]} List of suggestions. More info: https://nodejs.org/api/readline.html#use-of-the-completer-function
 */
export function autocompleteHandler(line: string, broker: import("moleculer").ServiceBroker, program: import('commander').Command): [string[], string];
/**
 * Returns list of available commands
 * @param {import('commander').Command} program
 * @returns {String[]} Available commands
 */
export function getAvailableCommands(program: import('commander').Command): string[];
