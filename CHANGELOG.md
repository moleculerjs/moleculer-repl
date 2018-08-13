--------------------------------------------------
<a name="0.5.2"></a>
# 0.5.2 (2018-08-13)

## Changes
- fix number of services in `nodes` result
- update dependencies

--------------------------------------------------
<a name="0.5.1"></a>
# 0.5.1 (2018-07-25)

## Changes
- handle JSON parsing error.
- update dependencies

--------------------------------------------------
<a name="0.5.0"></a>
# 0.5.0 (2018-07-08)

## Changes
- support Moleculer v.0.13.x
- filtering feature in `nodes`, `services`, `actions` & `events` command. (E.g.: `actions -f users.*`)
- unix-like key value pair normalization is switched off.

--------------------------------------------------
<a name="0.4.0"></a>
# 0.4.0 (2018-03-03)

## Changes
- support Moleculer v0.12.x
- support custom REPL commands
- new command: `bench [options] <action> [jsonParams]`: Benchmark services
- new command: `env`: List of environment variables
- new command: `clear`: Clear cacher
- measure execution time in `call` & `dcall` commands
- add autocomplete to `emit` and `bench` as well
- extendable with custom commands via ServiceBroker options (`replCommands`)
- new options in `call` & `dcall` commands:
    - `--load` - load params from a JSON file. The filename generated from action name. E.g. for `posts.find`˙action the filename is `<current_dir>/posts.find.params.json`
    - `--load [filename]` - load params from the specified JSON file
    - `--save` - save response to file. The filename generated from action name. E.g. for `posts.find`˙action the filename is `<current_dir>/posts.find.response.json`. The extension is `.json` when the response is `object`. Otherwise it is `.txt`.
    - `--save [filename]` - save reponse to the specified file
- new options in `nodes` command:
    - `--raw` - print entire service registry to then console as JSON
    - `--save [filename]` - save then entire service registry to the specified file as JSON
    