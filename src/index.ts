type NextFunction = (valueFromPrev?: any) => Promise<any>;

type Middleware<T = any> = (context: T, next: NextFunction, valueFromPrev?: any) => Promise<any>;

const buildNextFunction = <T>(middleware: Middleware<T>, context: T, next: NextFunction) => {
    let called = false;
    return async () => {
        if (called) {
            throw new Error('next() called multiple times');
        }
        called = true;
        try {
            return await middleware(context, next);
        } catch (e) {
            throw e;
        }
    };
};

const NOOP = async () => undefined;

const compose = <T = any>(middlewares: Middleware<T>[]) => {
    if (!Array.isArray(middlewares)) {
        throw new TypeError('Middleware stack must be an array!');
    }

    for (const fn of middlewares) {
        if (typeof fn !== 'function') {
            throw new TypeError('Middleware must be composed of functions!');
        }
    }

    return async (context: T, next?: NextFunction, initialValue?: any): Promise<any> => {
        let valueFromPrev = initialValue;
        const middlewareIncludingNext = next ? [...middlewares, next] : middlewares;
        const composed = middlewareIncludingNext.reduceRight(
            (next: NextFunction, currentMiddleware: Middleware) => {
                return buildNextFunction(
                    () =>
                        currentMiddleware(
                            context,
                            (prevValue) => {
                                valueFromPrev = prevValue; // save for next
                                return next(prevValue);
                            },
                            valueFromPrev,
                        ),
                    context,
                    next,
                );
            },
            buildNextFunction(() => valueFromPrev, context, NOOP), // final run
        );

        return composed();
    };
};

const parallel = <T>(middleware: Middleware[]) => async (context: T, next: NextFunction, valueFromPrev?: any) => {
    const result = await Promise.all(middleware.map((fn) => fn(context, NOOP, valueFromPrev)));
    return next(result);
};

export { compose, parallel, Middleware, NextFunction };
