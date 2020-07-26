# flow-compose

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Asynchronous flow control utilising a compose `middleware` returning a fully valid middleware 
comprised of all those which are passed.

The idea of middleware is to create small handlers that each perform a specific task and pass the result to the next step in a chain. 

This pattern has been implemented already in KoaJS for processing HTTP requests and does not have to be limited 
to just HTTP request and response cycle but apply to any asynchronous functions.

This is a TypeScript port of [koajs/koa-compose](https://github.com/koajs/compose) with extra

 - ability to specify own context type and 
 - optional passing of a value as parameter from previous middleware into the next

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
    logger: { log: (...args: any[]) => void };
    service: { get: () => Promise<string> };
};

async function handleError(context: MyContext, next: NextFunction) {
    try {
        return next();
    } catch (err) {
        // handle error
        return null;
    }
}

async function logRunningTime(context: MyContext, next: NextFunction) {
    const start = Date.now();
    const text = await next();
    const end = Date.now();

    context.logger.log('Total time:', end - start);

    return text;
}

async function print(context: MyContext, next: NextFunction, valueFromPrev: string) {
    context.logger.log('printing', valueFromPrev);
    return next(valueFromPrev);
}

async function transform(context: MyContext, next: NextFunction, valueFromPrev: string) {
    return valueFromPrev.toUpperCase();
}

async function fetch(context: MyContext, next: NextFunction) {
    const rawData = await context.service.get();

    return next(rawData);
}

const context: MyContext = {
    logger: { log: console.log },
    service: { get: async () => 'data' },
};

const result = await compose<MyContext>([handleError, logRunningTime, fetch, print, transform])(context);
```

[npm-image]: https://img.shields.io/npm/v/flow-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ctx-compose
[license-image]: http://img.shields.io/npm/l/flow-compose.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/flow-compose.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/flow-compose
