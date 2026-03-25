# moleculer-repl

Interactive REPL (Read-Eval-Print Loop) console for the [Moleculer](https://github.com/moleculerjs/moleculer) microservices framework.

## Project structure

```
src/
  index.js              # Main entry point — REPL server setup, evaluator, custom command registration
  commands/             # Built-in REPL commands (one file per command)
    index.js            # Auto-loads all command files via fast-glob
    call.js             # call / dcall commands
    bench.js            # Benchmark command
    emit.js             # Emit event
    broadcast.js        # Broadcast / broadcastLocal event
    actions.js          # List actions
    services.js         # List services
    events.js           # List event listeners
    nodes.js            # List nodes
    info.js             # Broker info
    metrics.js          # List metrics
    listener.js         # Subscribe to events in real-time
    load.js             # Load service from file/folder
    destroy.js          # Destroy a local service
    cache.js            # Cache keys / clear
    clear.js            # Clear cacher
    cls.js              # Clear console
    env.js              # List env vars
    quit.js             # Exit
  autocomplete.js       # Tab-completion for action names, events, node IDs
  args-parser.js        # Custom argument parser
  utils.js              # Shared utilities (convertArgs, isStream, formatNumber, etc.)
  flag-processing.js    # Flag type coercion helpers

examples/
  index.js              # Basic example (just starts REPL)
  simple/index.js       # Full example with custom commands, services, events

test/
  unit/                 # Unit tests (one per command)
  e2e/                  # End-to-end tests (spawns broker + REPL)

types/
  index.d.ts            # TypeScript declarations

index.js                # Package entry point (re-exports src/)
```

## Tech stack

- **Runtime**: Node.js >= 22
- **Peer dependency**: Moleculer >= 0.14.12 (targets 0.15.0)
- **CLI framework**: Commander.js (parses REPL commands)
- **REPL server**: Node.js built-in `repl` module
- **Testing**: Vitest with v8 coverage
- **Linting**: ESLint 9 (flat config) + Prettier
- **Style**: Tabs for indentation, semicolons required

## Commands

```bash
# Install dependencies
npm install

# Run tests
npm test                    # vitest --run --coverage
npx vitest run              # without coverage

# Run tests in watch mode
npm run ci                  # vitest (watch mode)

# Lint
npm run lint
npm run lint:fix

# Type check
npm run check               # tsc --noEmit

# Run example
node examples/simple/index.js
```

## Interactive REPL testing

Since this is an interactive REPL, you can't run it normally from a non-interactive shell.
Use **piped input with timeout** to test commands:

```bash
# Single command
echo "help" | timeout 5 node examples/simple/index.js

# Multiple commands
echo -e 'call greeter.hello {"name":"World"}\ncall math.add --a 5 --b 3\nactions\nservices' | timeout 5 node examples/simple/index.js

# Custom command test
echo "hi Norbi" | timeout 5 node examples/simple/index.js
```

The REPL reads from stdin, executes the commands, and the `timeout` ensures the process exits
(since the REPL would otherwise wait for more input). Check stdout for command output.

## Command architecture

Each command in `src/commands/` exports `{ register, declaration, handler }`:
- **`handler(broker, args)`** — The command logic. Receives the Moleculer broker and parsed arguments.
- **`declaration(program, broker, cmdHandler)`** — Registers the command with Commander.js (flags, options, preAction hook for argument parsing).
- **`register(program, broker)`** — Convenience wrapper that calls `declaration` with `handler`.

Commands are auto-discovered by `src/commands/index.js` using fast-glob.

## Key conventions

- Moleculer 0.15 streaming: streams are passed via **calling options** (`{ stream: readableStream }`), NOT as the payload/params argument.
- Meta keys use `#` prefix in CLI args (e.g., `--#key value`), calling options use `$` prefix (e.g., `--$timeout 3000`).
- The `$repl: true` meta flag is automatically added to all calls from the REPL.

## CI

GitHub Actions runs tests on Node.js 20.x, 22.x, and 24.x (ubuntu-latest).
