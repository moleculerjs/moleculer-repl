![Moleculer logo](http://moleculer.services/images/banner.png)

# REPL module for Moleculer [![NPM version](https://img.shields.io/npm/v/moleculer-repl.svg)](https://www.npmjs.com/package/moleculer-repl)

The `moleculer-repl` is an interactive console.

## Features
- list nodes
- list services
- list actions
- list events
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
const broker = new ServiceBroker();

broker.start().then(() => {
    // Start REPL
    broker.repl();
});
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
Copyright (c) 2020 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
