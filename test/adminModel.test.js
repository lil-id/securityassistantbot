const { botAdmins } = require('../src/models/admins/adminModel');
const { prisma } = require('../src/helpers/databaseConnection');
const logger = require('../src/helpers/logger');
const { create } = require('domain');

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        users: { findMany: jest.fn(), create: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
        admins: { findMany: jest.fn(), create: jest.fn(), createMany: jest.fn() },
        // feedbackUsers: { findMany: jest.fn(), create: jest.fn() },
        // feedbackAdmins: { findMany: jest.fn(), create: jest.fn() },
    },
}));
jest.mock('../src/helpers/logger');

describe('botAdmins', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addAdmins', () => {
        it('should add new admins and return their names', async () => {
            const admins = [
                { name: 'Admin1', id: { _serialized: '123' } },
                { name: 'Admin2', id: { _serialized: '456' } }
            ];

            prisma.users.findMany.mockResolvedValue([]);
            prisma.admins.createMany.mockResolvedValue({ count: 2 });

            const result = await botAdmins.addAdmins(admins);

            expect(prisma.users.findMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123', '456'] } },
                select: { numberPhone: true }
            });
            expect(prisma.admins.createMany).toHaveBeenCalledWith({
                data: [
                    { name: 'Admin1', numberPhone: '123' },
                    { name: 'Admin2', numberPhone: '456' }
                ],
                skipDuplicates: true
            });
            expect(result).toEqual(['Admin1', 'Admin2']);
        });

        it('should delete existing users and switch to admin role', async () => {
            const admins = [
                { name: 'Admin1', id: { _serialized: '123' } },
                { name: 'Admin2', id: { _serialized: '456' } }
            ];

            prisma.users.findMany.mockResolvedValue([{ numberPhone: '123' }]);
            prisma.users.deleteMany.mockResolvedValue({ count: 1 });
            prisma.admins.createMany.mockResolvedValue({ count: 2 });

            const result = await botAdmins.addAdmins(admins);

            expect(prisma.users.deleteMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123', '456'] } }
            });
            expect(logger.info).toHaveBeenCalledWith("Successfully switch to admin role.");
            expect(result).toEqual(['Admin1', 'Admin2']);
        });
    });

    describe('checkAdminAtUsers', () => {
        it('should return phone numbers of admins that exist as users', async () => {
            const admins = [
                { id: { _serialized: '123' } },
                { id: { _serialized: '456' } }
            ];

            prisma.users.findMany.mockResolvedValue([{ numberPhone: '123' }]);

            const result = await botAdmins.checkAdminAtUsers(admins);

            expect(prisma.users.findMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123', '456'] } },
                select: { numberPhone: true }
            });
            expect(result).toEqual(['123']);
        });
    });

    describe('checkExistingAdmins', () => {
        it('should return phone numbers of existing admins', async () => {
            const admins = [
                { id: { _serialized: '123' } },
                { id: { _serialized: '456' } }
            ];

            prisma.admins.findMany.mockResolvedValue([{ numberPhone: '123' }]);

            const result = await botAdmins.checkExistingAdmins(admins);

            expect(prisma.admins.findMany).toHaveBeenCalledWith({
                where: { numberPhone: { in: ['123', '456'] } },
                select: { numberPhone: true }
            });
            expect(result).toEqual(['123']);
        });
    });
});