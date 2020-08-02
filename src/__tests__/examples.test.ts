import { compose, NextFunction, parallel } from '../index';

describe('Examples', () => {
    it('as middleware', async () => {
        type MyContext = {
            logger: { log: (...args: any[]) => void };
            service: { get: () => Promise<string> };
            eventSender: { send: (data: string) => void };
        };
        const loggerMock = jest.fn();
        const eventSenderMock = jest.fn();

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

        async function ateCandies(context: MyContext, next: NextFunction, candies: any) {
            return next(context.person + ' ate ' + candies.join(','));
        }

        async function drankOrangeJuice(context: MyContext, next: NextFunction, valueFromPrev: any) {
            return next(valueFromPrev + ' and drank orange juice');
        }

        async function chocolate(context: MyContext, next: NextFunction, valueFromPrev: any) {
            return 'chocolate';
        }

        async function jellyBean(context: MyContext, next: NextFunction, valueFromPrev: any) {
            return 'jelly bean';
        }

        const getCandies = parallel([chocolate, jellyBean]);

        const result = await compose<MyContext>([getCandies, ateCandies, drankOrangeJuice])({ person: 'Tom' });
        expect(result).toEqual('Tom ate chocolate,jelly bean and drank orange juice');
    });
});
