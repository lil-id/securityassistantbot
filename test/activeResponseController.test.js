const { handleActiveResponseSummary } = require("../src/controllers/activeResponseController");
const { redisClient } = require("../src/helpers/redisConnection");
const logger = require("../src/helpers/logger");

jest.mock("../src/helpers/redisConnection");
jest.mock("../src/helpers/logger");

describe("handleActiveResponseSummary", () => {
    let client, message, args;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };
        message = {
            from: "testChatId",
            reply: jest.fn(),
        };
        args = [];
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should send a summary of alerts when alerts are available", async () => {
        redisClient.keys.mockResolvedValue(["alerts:1.1.1.1", "alerts:2.2.2.2"]);
        redisClient.lRange.mockResolvedValueOnce([
            JSON.stringify({
                src_ip: "1.1.1.1",
                agent: "agent1",
                level: 5,
                count: 10,
            }),
        ]);
        redisClient.lRange.mockResolvedValueOnce([
            JSON.stringify({
                src_ip: "2.2.2.2",
                agent: "agent2",
                level: 3,
                count: 5,
            }),
        ]);

        await handleActiveResponseSummary(client, message, args);
        expect(client.getChatById).toHaveBeenCalledWith("testChatId");
        expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Summary of alerts"));
        expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("1.1.1.1"));
        expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("2.2.2.2"));
    });

    it("should send a message indicating no alerts are available", async () => {
        redisClient.keys.mockResolvedValue([]);

        await handleActiveResponseSummary(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith("testChatId");
        expect(message.reply).toHaveBeenCalledWith("No alerts available");
    });

    it("should log an error if an exception occurs", async () => {
        const error = new Error("Test error");
        redisClient.keys.mockRejectedValue(error);

        await handleActiveResponseSummary(client, message, args);

        expect(logger.error).toHaveBeenCalledWith("Error getting active response:", error);
    });
});