# flow-compose

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Flow control for **any asynchronous functions** utilising a onion-like compose `middleware` returning a fully valid middleware 
comprised of all those which are passed.

The flow acts in a stack-like manner, allowing consumer to perform actions downstream then after actions on the response upstream.

This is based on popular [koajs/koa-compose](https://github.com/koajs/compose) rewritten in Typescript using reduce with 
 - ability to specify own context type and 
 - optional passing of a value from previous middleware into the next as a parameter ( so that it can be used as a I/O pipeline )

`koa-compose` pattern is very powerful and in fact it can be used beyond Koa framework. ( the namespace, the context API ) 

Ultimately this gives the consumer the ability to modularise different steps and in a process and control the flow.

## Installation

```sh
npm install flow-compose

# or using yarn
yarn add flow-compose
```

## Usage

As middleware: 
```typescript jsx
import { compose, NextFunction } from 'flow-compose';

type MyContext = {
    logger: { log: (...args: any[]) => void };
    service: { get: () => Promise<string> };
    eventSender: { send: (data: string) => void };
};

async function handleError(context: MyContext, next: NextFunction) {
    try {
        return await next();
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

async function fireEvent(context: MyContext, next: NextFunction, valueFromPrev: string) {
    context.eventSender.send(valueFromPrev);
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
    eventSender: { send: (data) => {} }
};

const result = await compose<MyContext>([handleError, logRunningTime, fetch, fireEvent, transform])(context);
```

As basic input/output pipeline: 
```typescript jsx
import { compose, NextFunction } from 'flow-compose';

type MyContext = {
    person: string
}

async function ateCandies(context: MyContext, next: NextFunction, candies: any) {
    return next(context.person + ' ate ' + candies.join(','));
}

async function drankOrangeJuice(context: MyContext, next: NextFunction, valueFromPrev: any) {
    return next(valueFromPrev + ' and drank orange juice')
}

async function chocolate(context:  MyContext, next: NextFunction, valueFromPrev: any) {
    return 'chocolate'
}

async function jellyBean(context: MyContext, next: NextFunction, valueFromPrev: any) {
    return 'jelly bean'
}

const getCandies = parallel([chocolate, jellyBean]);

const result = await compose<MyContext>([getCandies, ateCandies, drankOrangeJuice])({ person: 'Tom' });
```

[npm-image]: https://img.shields.io/npm/v/flow-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ctx-compose
[license-image]: http://img.shields.io/npm/l/flow-compose.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/flow-compose.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/flow-compose
