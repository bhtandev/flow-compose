import { compose, Middleware, NextFunction } from '../index';

const isPromise = (x: any) => {
    return x && typeof x.then === 'function';
};

describe('compose', () => {
    const delay = () => new Promise((resolve) => setTimeout(resolve, 1));
    it('should work', () => {
        const arr: number[] = [];
        const stack: Middleware[] = [];

        stack.push(async (context, next) => {
            arr.push(1);
            await delay();
            await next();
            await delay();
            arr.push(6);
        });

        stack.push(async (context, next) => {
            arr.push(2);
            await delay();
            await next();
            await delay();
            arr.push(5);
        });

        stack.push(async (context, next) => {
            arr.push(3);
            await delay();
            await next();
            await delay();
            arr.push(4);
        });

        return compose(stack)({}).then(() => {
            expect(arr).toEqual([1, 2, 3, 4, 5, 6]);
        });
    });

    it('should be able to be called twice', () => {
        const stack: Middleware[] = [];

        stack.push(async (context, next) => {
            context.arr.push(1);
            await delay();
            await next();
            await delay();
            context.arr.push(6);
        });

        stack.push(async (context, next) => {
            context.arr.push(2);
            await delay();
            await next();
            await delay();
            context.arr.push(5);
        });

        stack.push(async (context, next) => {
            context.arr.push(3);
            await delay();
            await next();
            await delay();
            context.arr.push(4);
        });

        const fn = compose(stack);
        const ctx1 = { arr: [] };
        const ctx2 = { arr: [] };
        const out = [1, 2, 3, 4, 5, 6];

        return fn(ctx1, async () => null)
            .then(() => {
                expect(out).toEqual(ctx1.arr);
                return fn(ctx2, async () => null);
            })
            .then(() => {
                expect(out).toEqual(ctx2.arr);
            });
    });

    it('should only accept an array', () => {
        let err;
        try {
            expect(compose({} as Middleware[])).toThrow();
        } catch (e) {
            err = e;
        }
        return expect(err).toBeInstanceOf(TypeError);
    });

    it('should create next functions that return a Promise', () => {
        const stack = [];
        const arr: any = [];
        for (let i = 0; i < 5; i++) {
            stack.push((context: any, next: NextFunction) => {
                arr.push(next());
            });
        }

        compose(stack as Middleware[])({});

        for (const next of arr) {
            expect(isPromise(next)).toBeTruthy();
        }
    });

    it('should work with 0 middleware', () => compose([])({}));

    it('should only accept middleware as functions', () => {
        let err;
        try {
            expect(compose([{} as Middleware])).toThrow();
        } catch (e) {
            err = e;
        }
        return expect(err).toBeInstanceOf(TypeError);
    });

    it('should work when yielding at the end of the stack', () => {
        const stack: Middleware[] = [];
        let called = false;

        stack.push(async (ctx, next) => {
            await next();
            called = true;
        });

        return compose(stack)({}).then(() => {
            expect(called).toBeTruthy();
        });
    });

    it('should reject on errors in middleware', () => {
        const stack: Middleware[] = [];

        stack.push(() => {
            throw new Error('expected');
        });

        return compose(stack)({})
            .then(() => {
                throw new Error('promise was not rejected');
            })
            .catch(function (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toEqual('expected');
            });
    });

    it('should work when yielding at the end of the stack with yield*', () => {
        const stack: Middleware[] = [];

        stack.push(async (ctx, next) => {
            await next;
        });

        compose(stack)({});
    });

    it('should keep the context', () => {
        const ctx = {};

        const stack: Middleware[] = [];

        stack.push(async (ctx2, next) => {
            await next();
            expect(ctx2).toEqual(ctx);
        });

        stack.push(async (ctx2, next) => {
            await next();
            expect(ctx2).toEqual(ctx);
        });

        stack.push(async (ctx2, next) => {
            await next();
            expect(ctx2).toEqual(ctx);
        });

        return compose(stack)(ctx);
    });

    it('should catch downstream errors', () => {
        const arr: number[] = [];
        const stack: Middleware[] = [];

        stack.push(async (ctx, next) => {
            arr.push(1);
            try {
                arr.push(6);
                await next();
                arr.push(7);
            } catch (err) {
                arr.push(2);
            }
            arr.push(3);
        });

        stack.push(async (ctx, next) => {
            arr.push(4);
            throw new Error();
            // arr.push(5)
        });

        return compose(stack)({}).then(() => {
            expect(arr).toEqual([1, 6, 4, 2, 3]);
        });
    });

    it('should compose w/ next', () => {
        let called = false;

        return compose([])({}, async () => {
            called = true;
        }).then(() => {
            expect(called).toBeTruthy();
        });
    });

    it('should handle errors in wrapped non-async functions', () => {
        const stack: Middleware[] = [];

        stack.push(() => {
            throw new Error('expected');
        });

        return compose(stack)({})
            .then(() => {
                throw new Error('promise was not rejected');
            })
            .catch(function (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toEqual('expected');
            });
    });

    // https://github.com/koajs/compose/pull/27#issuecomment-143109739
    it('should compose w/ other compositions', () => {
        const called: number[] = [];

        return compose([
            compose([
                (ctx, next) => {
                    called.push(1);
                    return next();
                },
                (ctx, next) => {
                    called.push(2);
                    return next();
                },
            ]),
            (ctx, next) => {
                called.push(3);
                return next();
            },
        ])({}).then(() => expect(called).toEqual([1, 2, 3]));
    });

    it('should throw if next() is called multiple times', () => {
        return compose([
            async (ctx, next) => {
                await next();
                await next();
            },
        ])({}).then(
            () => {
                throw new Error('boom');
            },
            (err) => {
                expect(err.message).toMatch(/multiple times/);
            },
        );
    });

    it('should return a valid middleware', async () => {
        let val = 0;
        await compose([
            compose([
                (ctx, next) => {
                    val++;
                    return next();
                },
                (ctx, next) => {
                    val++;
                    return next();
                },
            ]),
            (ctx, next) => {
                val++;
                return next();
            },
        ])({}).then(() => {
            expect(val).toEqual(3);
        });
    });

    it('should return last return value', () => {
        const stack: Middleware[] = [];

        stack.push(async (context, next) => {
            const val = await next();
            expect(val).toEqual(2);
            return 1;
        });

        stack.push(async (context, next) => {
            const val = await next();
            expect(val).toEqual(0);
            return 2;
        });
        const next: NextFunction = async () => 0;
        return compose(stack)({}, next).then(function (val) {
            expect(val).toEqual(1);
        });
    });

    it('should not affect the original middleware array', () => {
        const middleware: Middleware[] = [];
        const fn1: Middleware = (ctx, next) => {
            return next();
        };
        middleware.push(fn1);

        for (const fn of middleware) {
            expect(fn).toEqual(fn1);
        }

        compose(middleware);

        for (const fn of middleware) {
            expect(fn).toEqual(fn1);
        }
    });

    it('should not get stuck on the passed in next', () => {
        const middleware: Middleware[] = [
            (ctx, next) => {
                ctx.middleware++;
                return next();
            },
        ];
        const ctx = {
            middleware: 0,
            next: 0,
        };

        return compose(middleware)(ctx, function (ctx: any, next: NextFunction) {
            ctx.next++;
            return next();
        } as NextFunction).then(() => {
            expect(ctx).toEqual({ middleware: 1, next: 1 });
        });
    });

    it('should pass prev to next', async () => {
        const middleware: Middleware[] = [
            (ctx, next, prev) => {
                expect(prev).toEqual('passed');
                return next(prev);
            },
            (ctx, next, prev) => {
                expect(prev).toEqual('passed');
                return next(prev);
            },
        ];

        const res = await compose(middleware)({}, undefined, 'passed');
        expect(res).toEqual('passed');
    });
});

it('Example', async () => {
    type MyContext = {
        logger: { log: (...args: any[]) => void };
        service: { get: () => Promise<string> };
    };
    const loggerMock = jest.fn();

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
        context.logger.log('Printing', valueFromPrev);
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
        logger: { log: loggerMock },
        service: { get: async () => 'data' },
    };

    const result = await compose<MyContext>([handleError, logRunningTime, fetch, print, transform])(context);
    expect(result).toEqual('DATA');
    expect(loggerMock).toBeCalledTimes(2);
});
