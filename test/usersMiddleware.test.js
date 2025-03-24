const usersSession = require('../src/middleware/usersMiddleware');
const jwt = require('jsonwebtoken');
const { prisma } = require('../src/helpers/databaseConnection');
const logger = require('../src/helpers/logger');

jest.mock('jsonwebtoken');
jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        jWTAccessTokenUsers: {
            findUnique: jest.fn(),
        },
    },
}));
jest.mock('../src/helpers/logger');

describe('usersSession middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer token',
            },
        };
        res = {};
        next = jest.fn();

        jest.clearAllMocks();
    });

    it('should call next if no authorization header is present', async () => {
        req.headers.authorization = null;
        await usersSession(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should call next if authorization header does not start with Bearer', async () => {
        req.headers.authorization = 'Basic token';
        await usersSession(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should set req.users and call next if token is valid and user is found', async () => {
        const decoded = { id: 1 };
        const user = { idUser: 1 };

        jwt.verify.mockReturnValue(decoded);
        prisma.jWTAccessTokenUsers.findUnique.mockResolvedValue(user);

        await usersSession(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('token', process.env.TOKEN_CODE);
        expect(prisma.jWTAccessTokenUsers.findUnique).toHaveBeenCalledWith({
            where: { id: decoded.id },
        });
        expect(req.users).toEqual({ id: user.idUser });
        expect(next).toHaveBeenCalled();
    });

    it('should log error and call next if token is invalid', async () => {
        const error = new Error('Invalid token');
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        await usersSession(req, res, next);

        expect(logger.info).toHaveBeenCalledWith('Users middleware helpers error: ', error);
        expect(next).toHaveBeenCalled();
    });

    it('should log error and call next if user is not found', async () => {
        const decoded = { id: 1 };

        jwt.verify.mockReturnValue(decoded);
        prisma.jWTAccessTokenUsers.findUnique.mockResolvedValue(null);

        await usersSession(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('token', process.env.TOKEN_CODE);
        expect(prisma.jWTAccessTokenUsers.findUnique).toHaveBeenCalledWith({
            where: { id: decoded.id },
        });
        expect(logger.info).toHaveBeenCalledWith('Users middleware helpers error: ', new Error('Not Authorized'));
        expect(next).toHaveBeenCalled();
    });
});