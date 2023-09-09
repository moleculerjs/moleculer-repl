<a name="0.7.4"></a>
# 0.7.4 (2023-09-09)

## Changes
- allow to pass meta as JSON string [#71](https://github.com/moleculerjs/moleculer-repl/pull/71)
- Adds stream objectMode support and print stream to stdout [#72](https://github.com/moleculerjs/moleculer-repl/pull/72)
- show params of events [#74](https://github.com/moleculerjs/moleculer-repl/pull/74)

--------------------------------------------------
<a name="0.7.3"></a>
# 0.7.3 (2022-10-06)

## Changes
- add `--$local` option to `call` [#66](https://github.com/moleculerjs/moleculer-repl/pull/66)

--------------------------------------------------
<a name="0.7.2"></a>
# 0.7.2 (2022-08-13)

## Changes
- add REPL history [#64](https://github.com/moleculerjs/moleculer-repl/pull/64)

--------------------------------------------------
<a name="0.7.1"></a>
# 0.7.1 (2022-05-19)

## Changes
- rewritten types [#62](https://github.com/moleculerjs/moleculer-repl/pull/62). _Typescript users need it for Moleculer >=v0.14.20._
- add `--loadFull` to `call` command [#61](https://github.com/moleculerjs/moleculer-repl/pull/61)
- alias array supported [#59](https://github.com/moleculerjs/moleculer-repl/pull/59)

--------------------------------------------------
<a name="0.7.0"></a>
# 0.7.0 (2022-01-08)

## Rewritten codebase without vulnerable `vorpal` [#57](https://github.com/moleculerjs/moleculer-repl/pull/57)
Thanks to [@AndreMaz](https://github.com/AndreMaz), he has rewritten the REPL module because we had a lot of issue with the unmaintained `vorpal` dependency.
This new version is compatible with the previous versions and support everything what supported in previous versions but it can open new opportunities for us in the future. 

Kudos to André :tada:

_You may encounter changes in operations, this is why we increased the major version number._

--------------------------------------------------
<a name="0.6.6"></a>
# 0.6.6 (2021-06-27)

## Changes
- add `cache keys` & `cache clear` commands.

--------------------------------------------------
<a name="0.6.5"></a>
# 0.6.5 (2021-05-20)

## Changes
- improve `info` packet to show metrics `reporter` and tracing `exporter`.
- fix 'actions' command separation.
  
--------------------------------------------------
<a name="0.6.4"></a>
# 0.6.4 (2020-04-09)

## Setting meta keys for `call`, `dcall`, `emit` & `broadcast` commands
To set meta keys, use `#` prefix for arguments.

```bash
moleculer λ call greeter.echo --a 5 --#b 3
>> Response:
{ params: { a: 5 }, meta: { b: 3, '$repl': true } }
```

## Changes
- update deps & audit fix
- remove console log
  
--------------------------------------------------
<a name="0.6.3"></a>
# 0.6.3 (2020-02-24)

## Changes
- add autocomplete to dcall.
- return vorpal instance in `broker.repl()`.
- fix `metrics` execution if metrics is disabled.

--------------------------------------------------
<a name="0.6.2"></a>
# 0.6.2 (2019-12-15)

## Changes
- change chalk to kleur.
- fix middleware printing in `info` command.
- new `metrics` command for Moleculer v0.14.
- filtering in `services` command considers the service version.
- update dependencies

--------------------------------------------------
<a name="0.6.1"></a>
# 0.6.1 (2019-09-21)

## Changes
- fixed exit/quit command issue.

--------------------------------------------------
<a name="0.6.0"></a>
# 0.6.0 (2019-09-17)

## Changes
- add `$rest: true` into `ctx.meta` when using `call` or `dcall` commands.
- add meta option to `bench` command. `bench <action> [jsonParams] [meta]`
- fixed vulnerability issues in the vorpal library.
- supporting Moleculer v0.14

--------------------------------------------------
<a name="0.5.7"></a>
# 0.5.7 (2019-03-25)

## Changes
- added `destroy` method that allows to destroy a locally running service by providing `serviceName`

--------------------------------------------------
<a name="0.5.6"></a>
# 0.5.6 (2019-02-20)

## Changes
- add `meta` parameter for `call` & `dcall` commands. 
- update deps

--------------------------------------------------
<a name="0.5.5"></a>
# 0.5.5 (2019-01-08)

## Changes
- add repl options to change default delimiter (`mol $`). 
    ```js
    broker.repl({ 
        delimiter: "moleculer λ", 
        customCommands: [...]
    });
    ```
- update deps

--------------------------------------------------
<a name="0.5.4"></a>
# 0.5.4 (2018-12-18)

## Changes
- add streaming support for `call` and `dcall` commands.
- update deps

--------------------------------------------------
<a name="0.5.3"></a>
# 0.5.3 (2018-11-21)

## Changes
- fix some bugs
- show service version if it's `0`
- fix autocomplete bugs
- add `cls` command to clear console

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
- support Moleculer v0.13.x
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
    