![Moleculer logo](http://moleculer.services/images/banner.png)

# REPL module for Moleculer [![NPM version](https://img.shields.io/npm/v/moleculer-repl.svg)](https://www.npmjs.com/package/moleculer-repl)

The `moleculer-repl` is an interactive console. Created with [vorpal](https://github.com/dthree/vorpal).

## Features
- list actions
- list nodes
- list services
- call action
- emit event
- load services (from file or folder)
- subscribe and unsubscribe events
- show info from local node

## Install
```
npm install moleculer-repl --save
```

## Usage

**Start broker in REPL mode**
```js
let broker = new ServiceBroker({ logger: console });

// Start REPL
broker.repl();
```

You will get a console:

```bash
mol $ 
```

Write `help` to see available command.

## Documentation
Please read our [documentation on Moleculer site](http://moleculer.services/docs/moleculer-repl.html)


# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2017 Ice Services

[![@icebob](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)