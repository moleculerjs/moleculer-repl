![Moleculer logo](http://moleculer.services/images/banner.png)

# REPL module for Moleculer [![NPM version](https://img.shields.io/npm/v/moleculer-repl.svg)](https://www.npmjs.com/package/moleculer-repl)

The `moleculer-repl` is an interactive console. Created with [vorpal](https://github.com/dthree/vorpal).

## Features
- list nodes
- list services
- list actions
- call services
- emit events
- load services (from file or folder)
- show local informations & configuration
- benchmark services

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

Run `help` to see available commands.

## Documentation
Please read our [documentation on Moleculer site](http://moleculer.services/docs/moleculer-repl.html)


# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

# License
The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2018 MoleculerJS

[![@icebob](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/moleculerjs) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)
