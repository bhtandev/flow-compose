# flow-compose

[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![TypeScript][ts-image]][ts-url]

Flow control for **any asynchronous function** utilising a onion-like compose `middleware` returning a fully valid middleware 
comprised of all those which are passed.

The flow acts in a stack-like manner, allowing consumer to perform actions downstream then after actions on the response upstream.

This is based on popular [koajs/koa-compose](https://github.com/koajs/compose) rewritten in Typescript using reduce with 
 - ability to specify own context type and 
 - optional passing of a value from previous middleware into the next as a parameter. ( so that it can be used as a I/O pipeline )

```typescript
type Middleware<T = any> = (context: T, next: NextFunction, valueFromPrev?: any) => Promise<any>;
type NextFunction = (valueFromPrev?: any) => Promise<any>;
```

`koa-compose` pattern is very powerful and in fact it can be used beyond Koa framework. ( the namespace, the context API ) 

Ultimately this gives the consumer the ability to modularise different steps in a process and control the flow.

## Installation

```sh
npm install flow-compose

# or using yarn
yarn add flow-compose
```

## Usage

##### Middleware example: 
```typescript
import { compose, Middleware } from 'flow-compose';

type MyContext = {
    logger: { log: (...args: any[]) => void };
    service: { get: () => Promise<string> };
    eventSender: { send: (data: string) => void };
};

const handleError: Middleware<MyContext> = async (context, next) => {
    try {
        return await next();
    } catch (err) {
        // handle error
        return null;
    }
};

const logRunningTime: Middleware<MyContext> = async (context, next) => {
    const start = Date.now();
    const text = await next();
    const end = Date.now();

    context.logger.log('Total time:', end - start);

    return text;
};

const fireEvent: Middleware<MyContext> = async (context, next, valueFromPrev) => {
    context.eventSender.send(valueFromPrev);
    return next(valueFromPrev);
};

const transform: Middleware<MyContext> = async (context, next, valueFromPrev) => valueFromPrev.toUpperCase();

const fetch: Middleware<MyContext> = async (context, next) => {
    const rawData = await context.service.get();
    return next(rawData);
};

const context: MyContext = {
    logger: { log: console.log },
    service: { get: async () => 'data' },
    eventSender: { send: (data) => {} }
};

const result = await compose<MyContext>([handleError, logRunningTime, fetch, fireEvent, transform])(context);
```

##### Basic input/output pipeline example: 
```typescript
import { compose, Middleware, parallel } from 'flow-compose';

type MyContext = {
    person: string
}

const ateCandies: Middleware<MyContext> = async (context, next, valueFromPrev) => {
    return next(context.person + ' ate ' + valueFromPrev.join(','));
};

const drankOrangeJuice: Middleware<MyContext> = async (context, next, valueFromPrev) => {
    return next(valueFromPrev + ' and drank orange juice');
};

const chocolate: Middleware<MyContext> = async () => 'chocolate';
const jellyBean: Middleware<MyContext> = async () => 'jelly bean';
const getCandies: Middleware<MyContext> = parallel([chocolate, jellyBean]);

const result = await compose<MyContext>([getCandies, ateCandies, drankOrangeJuice])({ person: 'Tom' });
```

[npm-image]: https://img.shields.io/npm/v/flow-compose.svg?style=flat-square
[npm-url]: https://npmjs.org/package/flow-compose
[license-image]: http://img.shields.io/npm/l/flow-compose.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/flow-compose.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/flow-compose
[ts-image]: https://badges.frapsoft.com/typescript/code/typescript.svg?v=101
[ts-url]: https://github.com/ellerbrock/typescript-badges/
