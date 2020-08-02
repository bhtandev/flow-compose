import { Middleware, parallel } from '../index';

describe('parallel', () => {
    const delay = async (value: number) => new Promise((res) => setTimeout(() => res(value), 50));

    it('should resolve middlewares in parallel', async function () {
        const middlewares = [() => delay(1), () => delay(2), () => delay(3), () => delay(4), () => delay(5)];
        const res = await parallel(middlewares)({}, async (prev) => prev);
        expect(res).toEqual([1, 2, 3, 4, 5]);
    });

    it('should throw error if one throws', async () => {
        const middlewares = [
            async () => 1,
            () => {
                throw new Error('expected');
            },
            async () => 2,
        ];
        await expect(parallel(middlewares)({}, async (prev) => prev)).rejects.toThrow(
            expect.objectContaining({
                message: 'expected',
            }),
        );
    });

    it('should pass prev to all middlewares', async () => {
        const middlewares: Middleware[] = [(ctx, next, prev) => prev, (ctx, next, prev) => prev];
        const res = await parallel(middlewares)({}, async (prev) => prev, 'prev');
        expect(res).toEqual(['prev', 'prev']);
    });
});
