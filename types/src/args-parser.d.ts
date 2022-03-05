/**
 * Parses array of args into an object with key/values
 *
 * Example:
 *
 * ```js
 * // Input
 * const args = [ "--a", "5", "--b", "Bob", "--c", "--no-d", "--e.f", "hello", "--traceHash", "0x75", "--hash", "0x895", ];
 * // Output
 * const result = {
 * 		a: 5,
 * 		b: 'Bob',
 * 		c: true,
 * 		d: false,
 * 		e: { f: 'hello' },
 * 		traceHash: '0x75',
 * 		hash: '0x895'
 *	}
 *
 * ```
 *
 * @param {Array<String>} args args to parse
 * @returns {Object} parsed args
 */
export function parser(args: Array<string>): any;
