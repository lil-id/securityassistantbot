const { checkRoles } = require('../src/helpers/rolesChecker');
const { prisma } = require('../src/helpers/databaseConnection');

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        admins: {
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
});