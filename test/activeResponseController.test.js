const { handleActiveResponseSummary, abuseIpDBCheck, threatFoxCheck, isInteresting, trackAlert } = 
    require("../src/controllers/activeResponseController");
const { redisClient } = require("../src/helpers/redisConnection");
const logger = require("../src/helpers/logger");

jest.mock("../src/helpers/redisConnection", () => ({
    redisClient: {
        connect: jest.fn(),
        on: jest.fn(),
        keys: jest.fn(),
        lRange: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        incr: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
    },
}));

jest.mock("../src/controllers/activeResponseController", () => {
    const actualModule = jest.requireActual("../src/controllers/activeResponseController"); 
    return {
        ...actualModule,
        abuseIpDBCheck: jest.fn(),
        threatFoxCheck: jest.fn(),
        isInteresting: jest.fn(),
        trackAlert: jest.fn(),
    };
});

describe("handleActiveResponseSummary", () => {
    let client, message, args;

    beforeEach(() => {
        client = {
            sendMessage: jest.fn().mockResolvedValue(true),
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };
        message = {
            from: "testChat",
            reply: jest.fn().mockResolvedValue(true),
        };
        args = [];

        jest.clearAllMocks();
    });

    it("should send a summary of alerts when alerts are available", async () => {
        redisClient.keys.mockResolvedValue(["alerts:1.1.1.1", "alerts:2.2.2.2"]);
        redisClient.lRange
            .mockResolvedValueOnce([
                JSON.stringify({ src_ip: "1.1.1.1", level: 5, agent: "Agent A" }),
            ])
            .mockResolvedValueOnce([
                JSON.stringify({ src_ip: "2.2.2.2", level: 4, agent: "Agent B" }),
            ]);
    
        await handleActiveResponseSummary(client, message, args);
        
        expect(message.reply).toHaveBeenCalledTimes(1);
        expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Summary of alerts"));
    });
    

    it("should send a message indicating no alerts are available", async () => {
        redisClient.keys.mockResolvedValue([]);
        redisClient.lRange.mockResolvedValue([]); // Ensure lRange is mocked correctly

        await handleActiveResponseSummary(client, message, args);

        expect(message.reply).toHaveBeenCalledWith("No alerts available.");
    });

    it("should log an error if an exception occurs", async () => {
        logger.error = jest.fn();
        const testError = new Error("Test error");
        redisClient.keys.mockRejectedValue(testError);

        await handleActiveResponseSummary(client, message, args);

        expect(logger.error).toHaveBeenCalledWith("Error getting active response:", testError);
    });
});
