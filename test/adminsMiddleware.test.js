const adminsSession = require("../src/middleware/adminsMiddleware");
const jwt = require("jsonwebtoken");
const { prisma } = require("../src/helpers/databaseConnection");
const logger = require("../src/helpers/logger");

jest.mock("jsonwebtoken");
jest.mock("../src/helpers/databaseConnection", () => ({
    prisma: {
        jWTAccessTokenUsers: { delete: jest.fn(), create: jest.fn() },
        jWTAccessTokenAdmins: { 
            delete: jest.fn(), 
            create: jest.fn(), 
            findUnique: jest.fn()  // ✅ Fix: Ensure findUnique exists
        },
    },
}));
jest.mock("../src/helpers/logger");

describe("adminsSession Middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: "Bearer token",
            },
        };
        res = {};
        next = jest.fn();

        jest.clearAllMocks();
    });

    it("should call next if no authorization header is present", async () => {
        req.headers.authorization = null;
        await adminsSession(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it("should call next if authorization header does not start with Bearer", async () => {
        req.headers.authorization = "Basic token";
        await adminsSession(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it("should set req.admins and call next if token is valid and admin is found", async () => {
        const decoded = { id: 1 };
        const admin = { idAdmin: 1 };

        jwt.verify.mockReturnValue(decoded);
        prisma.jWTAccessTokenAdmins.findUnique.mockResolvedValue(admin); // ✅ Fix: Now it won't be undefined

        await adminsSession(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("token", process.env.TOKEN_CODE);
        expect(prisma.jWTAccessTokenAdmins.findUnique).toHaveBeenCalledWith({
            where: { id: decoded.id },
        });
        expect(req.admins).toEqual({ id: admin.idAdmin });
        expect(next).toHaveBeenCalled();
    });

    it("should log error and call next if token is invalid", async () => {
        const error = new Error("Invalid token");
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        await adminsSession(req, res, next);

        expect(logger.info).toHaveBeenCalledWith("Admins middleware helpers error: ", error);
        expect(next).toHaveBeenCalled();
    });

    it("should log error and call next if admin is not found", async () => {
        const decoded = { id: 1 };

        jwt.verify.mockReturnValue(decoded);
        prisma.jWTAccessTokenAdmins.findUnique.mockResolvedValue(null); // ✅ Fix: Ensure it's mocked

        await adminsSession(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("token", process.env.TOKEN_CODE);
        expect(prisma.jWTAccessTokenAdmins.findUnique).toHaveBeenCalledWith({
            where: { id: decoded.id },
        });
        expect(logger.info).toHaveBeenCalledWith("Admins middleware helpers error: ", new Error("Not Authorized"));
        expect(next).toHaveBeenCalled();
    });
});
