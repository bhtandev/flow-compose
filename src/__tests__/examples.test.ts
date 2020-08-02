import { compose, Middleware, NextFunction, parallel } from '../index';

describe('Examples', () => {
    it('as middleware', async () => {
        type MyContext = {
            logger: { log: (...args: any[]) => void };
            service: { get: () => Promise<string> };
            eventSender: { send: (data: string) => void };
        };
        const loggerMock = jest.fn();
        const eventSenderMock = jest.fn();

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
            logger: { log: loggerMock },
            service: { get: async () => 'data' },
            eventSender: {
                send: eventSenderMock,
            },
        };

        const result = await compose<MyContext>([handleError, logRunningTime, fetch, fireEvent, transform])(context);
        expect(result).toEqual('DATA');
        expect(loggerMock).toBeCalledTimes(1);
        expect(eventSenderMock).toBeCalledTimes(1);
    });

    it('as a basic input/output pipeline', async () => {
        type MyContext = {
            person: string;
        };

        const ateCandies: Middleware<MyContext> = async (
            context: MyContext,
            next: NextFunction,
            valueFromPrev: any,
        ) => {
            return next(context.person + ' ate ' + valueFromPrev.join(','));
        };

        const drankOrangeJuice: Middleware<MyContext> = async (
            context: MyContext,
            next: NextFunction,
            valueFromPrev: any,
        ) => {
            return next(valueFromPrev + ' and drank orange juice');
        };

        const chocolate: Middleware<MyContext> = async () => 'chocolate';
        const jellyBean: Middleware<MyContext> = async () => 'jelly bean';
        const getCandies: Middleware<MyContext> = parallel([chocolate, jellyBean]);

        const result = await compose<MyContext>([getCandies, ateCandies, drankOrangeJuice])({ person: 'Tom' });
        expect(result).toEqual('Tom ate chocolate,jelly bean and drank orange juice');
    });
});
