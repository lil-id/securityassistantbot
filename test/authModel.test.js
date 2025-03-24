const auth = require('../src/models/auth/authModel');
const { prisma } = require('../src/helpers/databaseConnection');
const jwt = require('jsonwebtoken');
const handleValidationErrors = require('../src/helpers/handleValidationError');

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    decode: jest.fn(),
}));

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        users: { findUnique: jest.fn(), create: jest.fn() },
        admins: { findUnique: jest.fn(), create: jest.fn() },
        jWTAccessTokenUsers: { delete: jest.fn(), create: jest.fn(), update: jest.fn() },
        jWTAccessTokenAdmins: { delete: jest.fn(), create: jest.fn(), update: jest.fn() },
    },
}));

jest.mock('../src/helpers/handleValidationError');

beforeEach(() => {
    jwt.sign.mockClear();
    jwt.decode.mockClear();
});

describe('Authentication', () => {
    describe('login', () => {
        it('should return validation error if body is invalid', async () => {
            const body = { numberPhone: '123' };
            handleValidationErrors.mockReturnValue({
                status: false,
                message: 'Validation error',
                code: 400,
                error: 'Validation error',
            });

            await expect(auth.login(body)).resolves.toEqual({
                status: false,
                message: 'Validation error',
                code: 400,
                error: 'Validation error',
            });
        });

        it('should return 404 if user and admin not found', async () => {
            const body = { numberPhone: '1234567890' };

            // Mocking user/admin lookup to return null (not found)
            prisma.users.findUnique.mockResolvedValue(null);
            prisma.admins.findUnique.mockResolvedValue(null);

            await expect(auth.login(body)).resolves.toEqual({
                status: false,
                message: 'failed',
                code: 404,
                error: 'Number phone not found.',
            });
        });

        it('should handle JWT token generation for users', async () => {
            const body = { numberPhone: '1234567890' };

            prisma.users.findUnique.mockResolvedValue({
                id: 1, // Ensure `id` exists
                JWTAccessTokenUsers: {
                    id: 10, 
                    token: 'mockedToken',
                    expiredIn: new Date(Date.now() + 1000 * 60 * 60 * 24), // Not expired
                },
            });
        
            jwt.sign.mockReturnValue('mockedToken');
            jwt.decode.mockReturnValue({ id: 10, exp: Math.floor(Date.now() / 1000) + 604800 }); // Valid for 7 days
            
            jwt.sign.mockReturnValue('mockedToken');

            await expect(auth.login(body)).resolves.toEqual({
                status: true,
                message: 'success',
                code: 200,
                data: { token: 'mockedToken' },
            });
        });

        it('should handle JWT token generation for admins', async () => {
            const body = { numberPhone: '1234567890' };

            prisma.admins.findUnique.mockResolvedValue({
                id: 1, // Ensure `id` exists
                JWTAccessTokenAdmins: {
                    id: 20,
                    token: 'mockedToken',
                    expiredIn: new Date(Date.now() + 1000 * 60 * 60 * 24),
                },
            });
        
            jwt.sign.mockReturnValue('mockedToken');
            jwt.decode.mockReturnValue({ id: 20, exp: Math.floor(Date.now() / 1000) + 604800 });     
            
            await expect(auth.login(body)).resolves.toEqual({
                status: true,
                message: 'success',
                code: 200,
                data: { token: 'mockedToken' },
            });
        });

        it('should return 400 if an unexpected error occurs', async () => {
            const body = { numberPhone: '1234567890' };
            prisma.users.findUnique.mockRejectedValue(new Error('Unexpected error'));

            await expect(auth.login(body)).resolves.toEqual({
                status: false,
                message: 'failed',
                code: 400,
                error: new Error('Unexpected error'),
            });
        });
    });

    describe('logout', () => {
        it('should delete JWT token for users', async () => {
            const id = 1;
            const type = 'users';
            prisma.jWTAccessTokenUsers.delete.mockResolvedValue({});

            await expect(auth.logout(id, type)).resolves.toEqual({
                status: true,
                message: 'success',
                code: 200,
            });
        });

        it('should delete JWT token for admins', async () => {
            const id = 1;
            const type = 'admins';
            prisma.jWTAccessTokenAdmins.delete.mockResolvedValue({});

            await expect(auth.logout(id, type)).resolves.toEqual({
                status: true,
                message: 'success',
                code: 200,
            });
        });

        it('should return 400 if an unexpected error occurs during logout', async () => {
            const id = 1;
            const type = 'users';

            // Simulate Prisma throwing an error
            prisma.jWTAccessTokenUsers.delete.mockRejectedValue(new Error('Unexpected error'));
            await expect(auth.logout(id, type)).resolves.toEqual({
                status: false,
                message: 'failed',
                code: 400,
                error: new Error('Unexpected error'),
            });
        });
    });
});
