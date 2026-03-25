![Moleculer logo](http://moleculer.services/images/banner.png)

# REPL module for Moleculer [![NPM version](https://img.shields.io/npm/v/moleculer-repl.svg)](https://www.npmjs.com/package/moleculer-repl)

The `moleculer-repl` is an interactive developer console for [Moleculer](https://github.com/moleculerjs/moleculer) microservices framework.

## Features
- List nodes, services, actions and events
- Call actions with parameters, meta and streaming support
- Direct call actions on specific nodes
- Emit and broadcast events
- Benchmark actions
- Cache management (list keys, clear)
- Load services from file or folder
- Listen to events in real-time
- Show local node information & configuration
- Show metrics
- Custom commands support
- Command history (persisted across sessions)
- Autocomplete for action names, event names and node IDs

## Requirements
- Node.js >= 22
- Moleculer >= 0.14.12 (0.15.0 compatible)

## Install
```
npm install moleculer-repl
```

## Usage

**Start broker in REPL mode**
```js
const { ServiceBroker } = require("moleculer");

const broker = new ServiceBroker();

broker.start().then(() => {
    broker.repl();
});
```

You will get a console:
```bash
mol $
```

Run `help` to see available commands.

### Custom delimiter
```js
// moleculer.config.js
module.exports = {
    replOptions: {
        delimiter: "moleculer λ"
    }
};
```

### Custom commands
```js
// moleculer.config.js
module.exports = {
    replOptions: {
        customCommands: [
            {
                command: "hello <name>",
                description: "Call the greeter.hello service with name",
                alias: "hi",
                options: [
                    { option: "-u, --uppercase", description: "Uppercase the name" }
                ],
                action(broker, args, helpers) {
                    const name = args.options.uppercase ? args.name.toUpperCase() : args.name;
                    return broker.call("greeter.hello", { name }).then(console.log);
                }
            }
        ]
    }
};
```

## Commands

### `call <actionName> [jsonParams] [meta]`
Call an action. Supports JSON params, key-value flags, meta, streaming and file I/O.

```bash
# Call with JSON params
mol $ call greeter.hello {"name":"World"}

# Call with key-value params
mol $ call greeter.hello --name World

# Call with meta (use # prefix)
mol $ call greeter.echo --a 5 --#b 3

# Call with calling options (use $ prefix)
mol $ call greeter.hello --name World --$timeout 3000

# Load params from file
mol $ call greeter.hello --load

# Load params, meta and options from file
mol $ call greeter.hello --loadFull params.json

# Send a file as stream
mol $ call file.save --stream ./data.bin

# Save response to file
mol $ call greeter.hello --save response.json

# Save streaming response to stdout
mol $ call greeter.objectStream --save stdout
```

### `dcall <nodeID> <actionName> [jsonParams] [meta]`
Direct call an action on a specific node. Same options as `call`.

### `emit <eventName> [jsonParams]`
Emit an event.
```bash
mol $ emit user.created {"name":"John"}
```

### `broadcast <eventName> [jsonParams]`
Broadcast an event to all nodes.
```bash
mol $ broadcast config.changed
```

### `bench <actionName> [jsonParams] [meta]`
Benchmark an action.
```bash
# Run for 5 seconds (default)
mol $ bench greeter.hello {"name":"World"}

# Run specific number of iterations
mol $ bench greeter.hello --num 1000

# Run for specific time
mol $ bench greeter.hello --time 10
```

### `actions [options]`
List available actions.
```bash
mol $ actions                    # List all actions
mol $ actions -f greeter.*       # Filter by pattern
mol $ actions -l                 # Only local actions
mol $ actions -i                 # Skip internal ($node) actions
mol $ actions -d                 # Show detailed info
```

### `services [options]`
List available services.
```bash
mol $ services                   # List all services
mol $ services -l                # Only local services
mol $ services -i                # Skip internal services
```

### `events [options]`
List available event subscriptions.
```bash
mol $ events                     # List all events
mol $ events -l                  # Only local events
mol $ events -i                  # Skip internal events
```

### `nodes [options]`
List known nodes.
```bash
mol $ nodes                      # List all nodes
mol $ nodes -a                   # Show all nodes (including unavailable)
mol $ nodes -d                   # Show detailed info
mol $ nodes --raw                # Print raw registry as JSON
mol $ nodes --save registry.json # Save registry to file
```

### `info`
Show broker information (version, uptime, services, transporter, serializer, etc.).

### `metrics [options]`
Show metrics.
```bash
mol $ metrics                    # List all metrics
mol $ metrics -f process.*       # Filter by pattern
```

### `listener <eventName>`
Subscribe and listen to an event in real-time.
```bash
mol $ listener user.**
```

### `load <servicePath>`
Load a service from a file.
```bash
mol $ load ./my-service.js
```

### `destroy <serviceName>`
Destroy a locally running service.

### `cache keys` / `cache clear [pattern]`
Manage the built-in cache.
```bash
mol $ cache keys                 # List cache keys
mol $ cache clear                # Clear all cache
mol $ cache clear greeter.*      # Clear matching keys
```

### `env`
List environment variables.

### `clear`
Clear the cacher.

### `cls`
Clear the console.

### `quit` / `exit`
Stop the broker and exit.

## Documentation
Please read our [documentation on Moleculer site](http://moleculer.services/docs/moleculer-repl.html)

# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2026 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
