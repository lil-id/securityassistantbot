const { handleCommandHistory } = require("../src/controllers/commandHistoryController");
const { commandHistory } = require("../src/models/commandHistory");
const { MessageMedia } = require("whatsapp-web.js");
const path = require("path");
const fs = require("fs");
const logger = require("../src/helpers/logger");

jest.mock("../src/models/commandHistory");
jest.mock("whatsapp-web.js", () => {
    return {
        MessageMedia: {
            fromFilePath: jest.fn(),
        },
    };
});
jest.mock("fs");
jest.mock("path");
jest.mock("../src/helpers/logger");

describe("handleCommandHistory", () => {
    let client, message;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };

        message = {
            from: "12345",
            reply: jest.fn(),
        };

        jest.clearAllMocks();
    });

    test("should reply with argument text message if userType is empty", async () => {
        await handleCommandHistory(client, message, [""]);

        expect(message.reply).toHaveBeenCalledWith(
            "Please provide argument text.\n\n`!history admin` or\n`!history user`"
        );
    });

    test("should fetch and reply with admin command history", async () => {
        const adminCommands = [
            { id: 1, name: "Admin1", activity: "Test", createdAt: new Date() },
        ];
        commandHistory.getCommandAdminHistory.mockResolvedValue(adminCommands);
        const media = { data: "media" };
        MessageMedia.fromFilePath.mockReturnValue(media);

        await handleCommandHistory(client, message, ["admin"]);

        expect(logger.info).toHaveBeenCalledWith("Fetching admin command history...");
        expect(commandHistory.getCommandAdminHistory).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith(media);
    });

    test("should fetch and reply with user command history", async () => {
        const userCommands = [
            { id: 1, name: "User1", activity: "Test", createdAt: new Date() },
        ];
        commandHistory.getCommandUserHistory.mockResolvedValue(userCommands);
        const media = { data: "media" };
        MessageMedia.fromFilePath.mockReturnValue(media);

        await handleCommandHistory(client, message, ["user"]);

        expect(logger.info).toHaveBeenCalledWith("Fetching user command history...");
        expect(commandHistory.getCommandUserHistory).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith(media);
    });

    test("should analyze admin command history", async () => {
        await handleCommandHistory(client, message, ["admin", "analyze"]);

        expect(commandHistory.analayzeCommandHistory).toHaveBeenCalledWith(message, "admin");
    });

    test("should analyze user command history", async () => {
        await handleCommandHistory(client, message, ["user", "analyze"]);

        expect(commandHistory.analayzeCommandHistory).toHaveBeenCalledWith(message, "user");
    });

    test("should log error if an exception occurs", async () => {
        const error = new Error("Test error");
        client.getChatById.mockRejectedValue(error);

        await handleCommandHistory(client, message, ["admin"]);

        expect(logger.error).toHaveBeenCalledWith("Error in handleCommandHistory");
    });
});