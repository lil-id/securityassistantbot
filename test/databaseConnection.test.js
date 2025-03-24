const { prisma, checkDatabaseConnection } = require("../src/helpers/databaseConnection");
const logger = require("../src/helpers/logger");

jest.mock("../src/helpers/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

describe("checkDatabaseConnection", () => {
    let connectMock, setTimeoutMock;

    beforeEach(() => {
        jest.clearAllMocks();
        connectMock = jest.spyOn(prisma, "$connect").mockResolvedValue();
        setTimeoutMock = jest.spyOn(global, "setTimeout"); // ✅ Mock setTimeout
    });

    afterEach(() => {
        setTimeoutMock.mockRestore(); // ✅ Restore original setTimeout after tests
    });

    it("should log success message when database connects successfully", async () => {
        await checkDatabaseConnection();

        expect(connectMock).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith("Database connected successfully.");
        expect(logger.info).toHaveBeenCalledWith("Waiting whatsapp client ready...");
    });

    it("should log error message and retry when database connection fails", async () => {
        const error = new Error("Database connection failed");
        connectMock.mockRejectedValue(error);

        await checkDatabaseConnection();

        expect(connectMock).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith("Error connecting to the database:", error.message);
        expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 5000); // ✅ Ensure retry logic works
    });
});
