# Zenvia Logger for Node.js

A wrapper for [Winston](https://github.com/winstonjs/winston) Logging [Node.js](https://nodejs.org/) library that formats the output on STDOUT as [Logstash](https://www.elastic.co/logstash) JSON format.

[![License](https://img.shields.io/github/license/zenvia/zenvia-logger-node.svg)](LICENSE.md)
[![Build Status](https://travis-ci.com/zenvia/zenvia-logger-node.svg?branch=master)](https://travis-ci.com/zenvia/zenvia-logger-node)
[![Coverage Status](https://coveralls.io/repos/github/zenvia/zenvia-logger-node/badge.svg?branch=master)](https://coveralls.io/github/zenvia/zenvia-logger-node?branch=master)
[![Dependencies](https://img.shields.io/david/zenvia/zenvia-logger-node.svg)](https://david-dm.org/zenvia/zenvia-logger-node)

[![Twitter Follow](https://img.shields.io/twitter/follow/ZenviaMobile.svg?style=social)](https://twitter.com/intent/follow?screen_name=ZenviaMobile)



## Installation

```bash
npm install @zenvia/logger
```



## Environment Variables

The following environment variables can be used for increase the log information:

- **APP_NAME**: value to filled the "application" field in the output JSON. If empty, the **name** attribute on `package.json` will be used instead.
- **NODE_ENV**: value to filled the "environment" field in the output JSON.
- **HOST** or **HOSTNAME**: value to filled the "host" field in the output JSON.
- **LOGGING_LEVEL**: set the level of messages that the logger should log. Default to `DEBUG`.
- **LOGGING_FORMATTER_DISABLED** *(version 1.1.0 and above)*: When `true`, the output logging will not be formatted to JSON. Useful during development time. Default to `false`.



## Basic Usage

```js
// ES5
const logger = require('@zenvia/logger');

// ES6 or Typescript
import * as logger from '@zenvia/logger';

logger.info('some message');
```

Output:

```bash
{
  "@timestamp": "2018-06-05T18:20:42.345Z",
  "@version": 1,
  "application": "application-name",
  "message": "some message",
  "level": "INFO"
}
```

### Available logging levels

The log levels are as follows.

- **fatal**
- **error**
- **warn**
- **info**
- **debug**

For backward compatibility purposes, **"verbose"** and **"silly"** levels will behave the same as "debug" level.



### Adding extra key/value fields

```js
logger.debug('Some text message', { keyA: 'value A', keyB: 'value B' });
```

Output:

```bash
{
  "keyA": "value A",
  "keyB": "value B",
  "@timestamp": "2018-06-05T22:04:42.039Z",
  "@version": 1,
  "application": "application-name",
  "message": "Some text message",
  "level": "DEBUG"
}
```

### Logging errors

```js
logger.error('Ops!', new Error('Something goes wrong'));
```

Output:

```bash
{
  "message": "Ops!: Something goes wrong",
  "@timestamp": "2018-06-05T22:14:09.683Z",
  "@version": 1,
  "application": "application-name",
  "level": "ERROR",
  "stack_trace": "Error: Something goes wrong\n    at repl:1:34\n    at Script.runInThisContext (vm.js:91:20)\n    at REPLServer.defaultEval (repl.js:317:29)\n    at bound (domain.js:396:14)\n    at REPLServer.runBound [as eval] (domain.js:409:12)\n    at REPLServer.onLine (repl.js:615:10)\n    at REPLServer.emit (events.js:187:15)\n    at REPLServer.EventEmitter.emit (domain.js:442:20)\n    at REPLServer.Interface._onLine (readline.js:290:10)\n    at REPLServer.Interface._line (readline.js:638:8)"
}
```

Due to limitations of winston lib, when a text, an error and extra key/value fields are logged at once, the output message field will contain the text message, the error message and the full stack trace as shown.

```js
logger.fatal('Ops!', new Error('Something goes wrong'), { keyA: 'value A', keyB: 'value B' });
```

Output:

```bash
{
  "keyA": "value A",
  "keyB": "value B",
  "@timestamp": "2018-06-05T22:09:22.750Z",
  "@version": 1,
  "application": "application-name",
  "message": "Ops! Error: Something goes wrong\n    at repl:1:34\n    at Script.runInThisContext (vm.js:91:20)\n    at REPLServer.defaultEval (repl.js:317:29)\n    at bound (domain.js:396:14)\n    at REPLServer.runBound [as eval] (domain.js:409:12)\n    at REPLServer.onLine (repl.js:615:10)\n    at REPLServer.emit (events.js:187:15)\n    at REPLServer.EventEmitter.emit (domain.js:442:20)\n    at REPLServer.Interface._onLine (readline.js:290:10)\n    at REPLServer.Interface._line (readline.js:638:8)",
  "level": "FATAL"
}
```



## License

[MIT](LICENSE.md)
