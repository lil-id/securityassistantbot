const { handleFeedback } = require("../src/controllers/feedbackController");
const { feedBack } = require("../src/models/feedBackModel");
const { checkRoles } = require("../src/helpers/rolesChecker");

jest.mock("../src/models/feedBackModel");
jest.mock("../src/helpers/rolesChecker");

describe("handleFeedback", () => {
    let client, message, args;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };

        message = {
            from: "12345",
            author: "67890",
            mentionedIds: ["11111"],
            getMentions: jest.fn().mockResolvedValue([{ name: "John Doe" }]),
            reply: jest.fn(),
        };

        args = ["This", "is", "a", "test"];
    });

    it("should send seen and typing state", async () => {
        await handleFeedback(client, message, args);
        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        const chat = await client.getChatById(message.from);
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
    });

    it("should reply with all feedbacks if user is admin and args is 'all'", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });
        feedBack.getFeedbacks.mockResolvedValue("All feedbacks data");

        args = ["all"];
        await handleFeedback(client, message, args);

        expect(feedBack.getFeedbacks).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith("All feedbacks:\n\nAll feedbacks data");
    });

    it("should reply with specific feedback if user is admin and mentionedIds is provided", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });
        feedBack.getFeedbackById.mockResolvedValue("Specific feedback data");
    
        // Ensure mentionedIds are set correctly before calling the function
        message.mentionedIds = ["11111"];
    
        await handleFeedback(client, message, args);
    
        // Check if getFeedbackById was called with the correct mentioned user
        expect(feedBack.getFeedbackById).toHaveBeenCalledWith(["11111"]);
        expect(message.reply).toHaveBeenCalledWith("Feedback from John Doe:\n\nSpecific feedback data");
    });
    

    it("should reply with instruction if user is admin and no feedback message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });

        args = []; // No feedback message
        message.mentionedIds = []; // No mentioned user

        await handleFeedback(client, message, args);

        expect(message.reply).toHaveBeenCalledWith(
            "Please provide feedback details or provide argument text.\n\n`!feedback` issue description\n`!feedback all` - Get all feedbacks \n`!feedback <userPhoneNumber>` - Get specific feedback"
        );
    });

    it("should create feedback if user is admin and feedback message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });

        args = ["This is a test"];
        message.mentionedIds = [];
        await handleFeedback(client, message, args);

        expect(feedBack.createFeedback).toHaveBeenCalledWith(message.author, args.join(" "));
        expect(message.reply).toHaveBeenCalledWith("Thank you for your feedback! It has been recorded.");
    });

    it("should reply with instruction if user is not admin and no feedback message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "user" });

        args = [];
        await handleFeedback(client, message, args);

        expect(message.reply).toHaveBeenCalledWith(
            "Please provide feedback details or provide argument text.\n\n`!feedback` issue description\n"
        );
    });

    it("should create feedback if user is not admin and feedback message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "user" });

        await handleFeedback(client, message, args);

        expect(feedBack.createFeedback).toHaveBeenCalledWith(message.author, args.join(" "));
        expect(message.reply).toHaveBeenCalledWith("Thank you for your feedback! It has been recorded.");
    });

    it("should log error if an exception occurs", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        client.getChatById.mockRejectedValue(new Error("Test error"));

        await handleFeedback(client, message, args);

        expect(consoleSpy).toHaveBeenCalledWith("Error handling feedback:", expect.any(Error));
        consoleSpy.mockRestore();
    });
});