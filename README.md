# flow-compose

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Universal compose `middleware` returning a fully valid middleware comprised of all those which are passed.

This is a TypeScript port of koa-compose [koajs/koa-compose](https://github.com/koajs/compose) with just added optional previous middleware value passing similar to act as a 'pipe' because as a composition utility, there are use cases beyond koa middleware. 

## Installation

```sh
npm install flow-compose

# or using yarn
yarn add flow-compose
```

## Usage

```typescript jsx
// Module import
import { compose, NextFunction } from 'flow-compose';

type MyContext = {
    logger: { log: (...args: any[]) => void },
    service: { get: () => Promise<string> },
}

async function logRunningTime (context: MyContext, next: NextFunction) {
    const start = Date.now();
    const text = await next()
    const end = Date.now();

    context.logger.log('Total time:', end - start);
    return text;
}

async function print (context: MyContext, next: NextFunction) {
    const text = await next()
    context.logger.log('Printing', text);
    return text;
}

async function transform (context: MyContext, next: NextFunction) {
    const text = await next();
    return text.toUpperCase();
}

async function fetch (context: MyContext, next: NextFunction) {
    return context.service.get();
}

// dependency inject services
const context: MyContext = {
    logger: { log: console.log },
    service: { get: async () => 'data' },
}

const result = await compose([logRunningTime, print, transform, fetch])(context)

```

[npm-image]: https://img.shields.io/npm/v/flow-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ctx-compose
[license-image]: http://img.shields.io/npm/l/flow-compose.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/flow-compose.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/flow-compose
