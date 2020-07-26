type NextFunction = (previousResult?: any) => Promise<any>;

type Middleware<T = any> = (context: T, next: NextFunction, PreviousResult?: any) => Promise<any>;

const compose = <T = any>(middleware: Middleware<T>[]) => {
    if (!Array.isArray(middleware)) {
        throw new TypeError('Middleware stack must be an array!');
    }

    for (const fn of middleware) {
        if (typeof fn !== 'function') {
            throw new TypeError('Middleware must be composed of functions!');
        }
    }

    return function (context: T, next?: NextFunction, previousResult?: any): Promise<any> {
        // last called middleware #
        let index = -1;

        return dispatch(0, previousResult);

        async function dispatch(i: number, previousResult: any): Promise<any> {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }

            index = i;

            let fn: Middleware | NextFunction | undefined = middleware[i];

            if (i === middleware.length) {
                fn = next;
            }

            if (!fn) {
                return previousResult;
            }

            return fn(
                context,
                (previousResult: any): Promise<any> => {
                    return dispatch(i + 1, previousResult);
                },
                previousResult,
            );
        }
    };
};

export { compose, Middleware, NextFunction };
