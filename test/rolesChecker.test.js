const { checkRoles } = require('../src/helpers/rolesChecker');
const { prisma } = require('../src/helpers/databaseConnection');

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        admins: {
            findUnique: jest.fn()
        },
        users: {
            findUnique: jest.fn()
        }
    }
}));

describe('checkRoles', () => {
    it('should return admin details when admin is found', async () => {
        const mockAdmin = { id: 1, name: 'Admin', role: 'admin' };
        prisma.admins.findUnique.mockResolvedValue(mockAdmin);

        const sender = '1234567890';
        const result = await checkRoles(sender);

        expect(prisma.admins.findUnique).toHaveBeenCalledWith({
            where: { numberPhone: sender },
            select: { id: true, name: true, role: true }
        });
        expect(result).toEqual(mockAdmin);
    });

    it('should return null when admin is not found', async () => {
        prisma.admins.findUnique.mockResolvedValue(null);

        const sender = '0987654321';
        const result = await checkRoles(sender);

        expect(prisma.admins.findUnique).toHaveBeenCalledWith({
            where: { numberPhone: sender },
            select: { id: true, name: true, role: true }
        });
        expect(result).toBeNull();
    });

    describe('checkRoles', () => {
        it('should return admin details when admin is found', async () => {
            const mockAdmin = { id: 1, name: 'Admin', role: 'admin' };
            prisma.admins.findUnique.mockResolvedValue(mockAdmin);

            const sender = '1234567890';
            const result = await checkRoles(sender);

            expect(prisma.admins.findUnique).toHaveBeenCalledWith({
                where: { numberPhone: sender },
                select: { id: true, name: true, role: true }
            });
            expect(result).toEqual(mockAdmin);
        });

        it('should return user details when admin is not found but user is found', async () => {
            prisma.admins.findUnique.mockResolvedValue(null);
            const mockUser = { id: 2, name: 'User', role: 'user' };
            prisma.users.findUnique.mockResolvedValue(mockUser);

            const sender = '0987654321';
            const result = await checkRoles(sender);

            expect(prisma.admins.findUnique).toHaveBeenCalledWith({
                where: { numberPhone: sender },
                select: { id: true, name: true, role: true }
            });
            expect(prisma.users.findUnique).toHaveBeenCalledWith({
                where: { numberPhone: sender },
                select: { id: true, name: true, role: true }
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null when neither admin nor user is found', async () => {
            prisma.admins.findUnique.mockResolvedValue(null);
            prisma.users.findUnique.mockResolvedValue(null);

            const sender = '1122334455';
            const result = await checkRoles(sender);

            expect(prisma.admins.findUnique).toHaveBeenCalledWith({
                where: { numberPhone: sender },
                select: { id: true, name: true, role: true }
            });
            expect(prisma.users.findUnique).toHaveBeenCalledWith({
                where: { numberPhone: sender },
                select: { id: true, name: true, role: true }
            });
            expect(result).toBeNull();
        });
    });
});