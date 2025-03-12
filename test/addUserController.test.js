const { handleAddUserCommand } = require("../src/controllers/users/addUserController");
const { botUsers } = require("../src/models/users/userModel");

jest.mock("../src/models/users/userModel");
jest.mock("../src/views/responseMessage", () => ({ userHelpMessage: "Here is your help message." }));

describe("handleAddUserCommand", () => {
    let client, message, chat;

    beforeEach(() => {
        jest.clearAllMocks();

        chat = { sendSeen: jest.fn(), sendStateTyping: jest.fn() };
        client = { getChatById: jest.fn().mockResolvedValue(chat) };
        message = {
            from: "testUser",
            getMentions: jest.fn().mockResolvedValue([]),
            reply: jest.fn()
        };

        botUsers.checkExistingUsers.mockResolvedValue([]);
        botUsers.addUsers.mockResolvedValue([]);
    });

    it("should send seen and typing state", async () => {
        await handleAddUserCommand(client, message);
        expect(client.getChatById).toHaveBeenCalledWith("testUser");
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
    });

    it("should reply if no users are mentioned", async () => {
        message.getMentions.mockResolvedValue([]);

        await handleAddUserCommand(client, message);

        expect(message.reply).toHaveBeenCalledWith("No valid users mentioned.");
    });

    it("should reply with existing users if they already exist", async () => {
        const mentions = [{ id: { _serialized: "user1" }, name: "User One" }];
        message.getMentions.mockResolvedValue(mentions);
        botUsers.checkExistingUsers.mockResolvedValue(["user1"]);

        await handleAddUserCommand(client, message);

        expect(message.reply).toHaveBeenCalledWith("The following users already exist:\n\n🐨 User One");
    });

    it("should add new users and reply with success message", async () => {
        const mentions = [
            { id: { _serialized: "user1" }, name: "User One" },
            { id: { _serialized: "user2" }, name: "User Two" },
        ];
        message.getMentions.mockResolvedValue(mentions);
        botUsers.checkExistingUsers.mockResolvedValue([]);
        botUsers.addUsers.mockResolvedValue(["User One", "User Two"]);

        await handleAddUserCommand(client, message);

        expect(botUsers.addUsers).toHaveBeenCalledWith(mentions);
        expect(message.reply.mock.calls).toEqual([
            ["Users have been added successfully:\n\n🐨 User One\n🐨 User Two"],
            ["Welcome to the team chief! 🎉"],
            ["Here is your help message."],
        ]);
    });

    it("should handle a mix of existing and new users", async () => {
        const mentions = [
            { id: { _serialized: "user1" }, name: "User One" },
            { id: { _serialized: "user2" }, name: "User Two" },
        ];
        message.getMentions.mockResolvedValue(mentions);
        botUsers.checkExistingUsers.mockResolvedValue(["user1"]);
        botUsers.addUsers.mockResolvedValue(["User Two"]);

        await handleAddUserCommand(client, message);

        expect(message.reply.mock.calls).toEqual([
            ["The following users already exist:\n\n🐨 User One"],
            ["Users have been added successfully:\n\n🐨 User Two"],
            ["Welcome to the team chief! 🎉"],
            ["Here is your help message."],
        ]);
    });

    it("should not add users if all are duplicates", async () => {
        const mentions = [
            { id: { _serialized: "user1" }, name: "User One" },
            { id: { _serialized: "user2" }, name: "User Two" },
        ];
        message.getMentions.mockResolvedValue(mentions);
        botUsers.checkExistingUsers.mockResolvedValue(["user1", "user2"]);

        await handleAddUserCommand(client, message);

        expect(botUsers.addUsers).not.toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith("The following users already exist:\n\n🐨 User One\n🐨 User Two");
    });
});
