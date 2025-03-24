const { botUsers } = require('../src/models/users/userModel');
const { prisma } = require('../src/helpers/databaseConnection');
const logger = require('../src/helpers/logger');

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        admins: {
            findMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        users: {
            createMany: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

jest.mock('../src/helpers/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}));

describe('botUsers', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addUsers', () => {
        it('should log an error and return an empty array if users array is empty or undefined', async () => {
            const result = await botUsers.addUsers([]);
            expect(logger.error).toHaveBeenCalledWith("addUsers() received empty users array or undefined");
            expect(result).toEqual([]);

            const resultUndefined = await botUsers.addUsers(undefined);
            expect(logger.error).toHaveBeenCalledWith("addUsers() received empty users array or undefined");
            expect(resultUndefined).toEqual([]);
        });

        it('should delete admins and log info if users exist as admins', async () => {
            const users = [{ id: { _serialized: '123' }, name: 'User1' }];
            prisma.admins.findMany.mockResolvedValue([{ numberPhone: '123' }]);
            prisma.admins.deleteMany.mockResolvedValue({ count: 1 });
            prisma.users.createMany.mockResolvedValue({ count: 1 });

            const result = await botUsers.addUsers(users);

            expect(prisma.admins.findMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123'] } },
                select: { numberPhone: true },
            });
            expect(prisma.admins.deleteMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123'] } },
            });
            expect(logger.info).toHaveBeenCalledWith("Successfully switch to user role.");
            expect(result).toEqual(['User1']);
        });

        it('should log a warning and return an empty array if no new users were added', async () => {
            const users = [{ id: { _serialized: '123' }, name: 'User1' }];
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.createMany.mockResolvedValue({ count: 0 });

            const result = await botUsers.addUsers(users);

            expect(logger.warn).toHaveBeenCalledWith("⚠️ No new users were added (possible duplicates)");
            expect(result).toEqual([]);
        });

        it('should return the names of the added users', async () => {
            const users = [
                { id: { _serialized: '123' }, name: 'User1' },
                { id: { _serialized: '456' }, name: 'User2' },
            ];
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.createMany.mockResolvedValue({ count: 2 });

            const result = await botUsers.addUsers(users);

            expect(result).toEqual(['User1', 'User2']);
        });
    });

    describe('checkUserAtAdmins', () => {
        it('should return the phone numbers of users that exist as admins', async () => {
            const users = [{ id: { _serialized: '123' } }];
            prisma.admins.findMany.mockResolvedValue([{ numberPhone: '123' }]);

            const result = await botUsers.checkUserAtAdmins(users);

            expect(result).toEqual(['123']);
        });

        it('should return an empty array if no users exist as admins', async () => {
            const users = [{ id: { _serialized: '123' } }];
            prisma.admins.findMany.mockResolvedValue([]);

            const result = await botUsers.checkUserAtAdmins(users);

            expect(result).toEqual([]);
        });
    });

    describe('checkExistingUsers', () => {
        it('should return the phone numbers of existing users', async () => {
            const users = [{ id: { _serialized: '123' } }];
            prisma.users.findMany.mockResolvedValue([{ numberPhone: '123' }]);

            const result = await botUsers.checkExistingUsers(users);

            expect(result).toEqual(['123']);
        });

        it('should return an empty array if no users exist', async () => {
            const users = [{ id: { _serialized: '123' } }];
            prisma.users.findMany.mockResolvedValue([]);

            const result = await botUsers.checkExistingUsers(users);

            expect(result).toEqual([]);
        });
    });
});