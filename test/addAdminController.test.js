const { handleAddDeleteAdminCommand } = require("../src/controllers/admins/addAdminController");
const { botAdmins } = require("../src/models/admins/adminModel");
const { adminHelpMessage } = require("../src/views/responseMessage");

jest.mock("../src/models/admins/adminModel");
jest.mock("../src/views/responseMessage", () => ({
    adminHelpMessage: "Help message for admins"
}));

describe("handleAddDeleteAdminCommand", () => {
    let client, message, chat;

    beforeEach(() => {
        chat = {
            sendSeen: jest.fn(),
            sendStateTyping: jest.fn()
        };

        client = {
            getChatById: jest.fn().mockResolvedValue(chat)
        };

        message = {
            from: "test_from",
            getMentions: jest.fn(),
            reply: jest.fn()
        };
    });

    it("should notify if mentioned admins already exist", async () => {
        const mentions = [
            { id: { _serialized: "admin1" }, name: "Admin One" },
            { id: { _serialized: "admin2" }, name: "Admin Two" }
        ];

        const args = ["@admin1", "@admin2"];
        message.getMentions.mockResolvedValue(mentions);
        botAdmins.checkExistingAdmins.mockResolvedValue(["admin1"]);

        await handleAddDeleteAdminCommand(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith("test_from");
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith(
            "The following admins already exist:\n\n🐨 Admin One"
        );
    });

    it("should add new admins and send welcome messages", async () => {
        const mentions = [
            { id: { _serialized: "admin1" }, name: "Admin One" },
            { id: { _serialized: "admin2" }, name: "Admin Two" }
        ];

        const args = ["@admin1", "@admin2"];
        message.getMentions.mockResolvedValue(mentions);
        botAdmins.checkExistingAdmins.mockResolvedValue([]);
        botAdmins.addAdmins.mockResolvedValue(["Admin One", "Admin Two"]);

        await handleAddDeleteAdminCommand(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith("test_from");
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith(
            "Admins have been added successfully:\n\n🐨 Admin One\n🐨 Admin Two"
        );
        expect(message.reply).toHaveBeenCalledWith("Welcome to the team chief! 🎉");
        expect(message.reply).toHaveBeenCalledWith(adminHelpMessage);
    });

    it("should handle a mix of existing and new admins", async () => {
        const mentions = [
            { id: { _serialized: "admin1" }, name: "Admin One" },
            { id: { _serialized: "admin2" }, name: "Admin Two" }
        ];

        const args = ["@admin1", "@admin2"];
        message.getMentions.mockResolvedValue(mentions);
        botAdmins.checkExistingAdmins.mockResolvedValue(["admin1"]);
        botAdmins.addAdmins.mockResolvedValue(["Admin Two"]);

        await handleAddDeleteAdminCommand(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith("test_from");
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith(
            "The following admins already exist:\n\n🐨 Admin One"
        );
        expect(message.reply).toHaveBeenCalledWith(
            "Admins have been added successfully:\n\n🐨 Admin Two"
        );
        expect(message.reply).toHaveBeenCalledWith("Welcome to the team chief! 🎉");
        expect(message.reply).toHaveBeenCalledWith(adminHelpMessage);
    });

    it("should notify if no valid admins are mentioned", async () => {
        const mentions = [];
        const args = [];
        message.getMentions.mockResolvedValue(mentions);

        await handleAddDeleteAdminCommand(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith("test_from");
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith("No valid admins mentioned.");
        expect(message.reply).toHaveBeenCalledWith(
            "Usage:\n`!admin @mention1 @mention2` - To add a new admin\n\n" +
            "`!admin remove @mention1 @mention2` - To remove an admin"
        );
    });
});