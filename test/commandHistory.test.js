const { commandHistory } = require("../src/models/commandHistory");
const { prisma } = require("../src/helpers/databaseConnection");
const logger = require("../src/helpers/logger");
const { ollamaModel } = require("../src/models/ai/ollamaModel");

jest.mock("../src/helpers/databaseConnection", () => ({
    prisma: {
        adminActivitylogs: {
            findMany: jest.fn(),
        },
        userActivitylogs: {
            findMany: jest.fn(),
        },
    },
}));
jest.mock("../src/helpers/logger");
jest.mock("../src/models/ai/ollamaModel");

describe("commandHistory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getCommandAdminHistory", () => {
        it("should fetch admin command history", async () => {
            const mockAdminHistory = [
                { id: 1, name: "admin1", activity: "login", createdAt: new Date() },
            ];
            prisma.adminActivitylogs.findMany.mockResolvedValue(mockAdminHistory);

            const result = await commandHistory.getCommandAdminHistory();

            expect(logger.info).toHaveBeenCalledWith("Getting admin history command");
            expect(prisma.adminActivitylogs.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
            });
            expect(result).toEqual(mockAdminHistory);
        });
    });

    describe("getCommandUserHistory", () => {
        it("should fetch user command history", async () => {
            const mockUserHistory = [
                { id: 1, name: "user1", activity: "login", createdAt: new Date() },
            ];
            prisma.userActivitylogs.findMany.mockResolvedValue(mockUserHistory);

            const result = await commandHistory.getCommandUserHistory();

            expect(logger.info).toHaveBeenCalledWith("Getting user history command");
            expect(prisma.userActivitylogs.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
            });
            expect(result).toEqual(mockUserHistory);
        });
    });

    describe("analayzeCommandHistory", () => {
        it("should analyze admin command history", async () => {
            const mockMessage = { reply: jest.fn() };
            const mockAdminHistory = [
                { id: 1, name: "admin1", activity: "login", createdAt: new Date() },
            ];
            prisma.adminActivitylogs.findMany.mockResolvedValue(mockAdminHistory);
            ollamaModel.sendPrompt.mockResolvedValue("AI response");

            await commandHistory.analayzeCommandHistory(mockMessage, "admin");

            expect(logger.info).toHaveBeenCalledWith("Analyzing admin command history...");
            expect(prisma.adminActivitylogs.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });
            expect(mockMessage.reply).toHaveBeenCalledWith(
                "Asking AI...\n\nThis may take 10 minutes or more..."
            );
            expect(ollamaModel.sendPrompt).toHaveBeenCalled();
            expect(mockMessage.reply).toHaveBeenCalledWith("AI response");
        });

        it("should analyze user command history", async () => {
            const mockMessage = { reply: jest.fn() };
            const mockUserHistory = [
                { id: 1, name: "user1", activity: "login", createdAt: new Date() },
            ];
            prisma.userActivitylogs.findMany.mockResolvedValue(mockUserHistory);
            ollamaModel.sendPrompt.mockResolvedValue("AI response");

            await commandHistory.analayzeCommandHistory(mockMessage, "user");

            expect(logger.info).toHaveBeenCalledWith("Analyzing user command history...");
            expect(prisma.userActivitylogs.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });
            expect(mockMessage.reply).toHaveBeenCalledWith(
                "Asking AI...\n\nThis may take 10 minutes or more..."
            );
            expect(ollamaModel.sendPrompt).toHaveBeenCalled();
            expect(mockMessage.reply).toHaveBeenCalledWith("AI response");
        });
    });
});