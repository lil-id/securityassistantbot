const { ollamaModel } = require("../src/models/ai/ollamaModel");
const logger = require("../src/helpers/logger");
const { handleAddAICommand, handleSecurityRecommendation } = require("../src/controllers/ai/ollamaController");

jest.mock("../src/models/ai/ollamaModel");
jest.mock("../src/helpers/logger");

describe("handleAddAICommand", () => {
    let client, message, args, chat;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };
        message = {
            from: "testUser",
            reply: jest.fn(),
            _data: {
                quotedMsg: {
                    body: "quoted message",
                },
            },
        };
        args = ["test", "argument"];
        chat = {
            sendSeen: jest.fn(),
            sendStateTyping: jest.fn(),
        };
    });

    it("should reply with 'AI server is not running.' if the server is not running", async () => {
        ollamaModel.isServerRunning.mockResolvedValue(false);

        await handleAddAICommand(client, message, args);

        expect(logger.info).toHaveBeenCalledWith("AI server is not running.");
        expect(message.reply).toHaveBeenCalledWith("AI server is not running.");
    });

    it("should log and reply with an error message if an error occurs", async () => {
        ollamaModel.isServerRunning.mockResolvedValue(false);
        message.reply.mockImplementationOnce(() => {
            throw new Error("Test error");
        });

        await handleAddAICommand(client, message, args);

        expect(logger.error).toHaveBeenCalledWith(
            "Error in handleAddAICommand:",
            expect.any(Error)
        );
        expect(message.reply).toHaveBeenCalledWith("Error in handleAddAICommand");
    });

    it("should send a prompt to the AI and reply with the response", async () => {
        ollamaModel.isServerRunning.mockResolvedValue(true);
        ollamaModel.sendPrompt.mockResolvedValue("AI response");

        await handleAddAICommand(client, message, args);

        expect(logger.info).toHaveBeenCalledWith("Asking AI...");
        expect(logger.info).toHaveBeenCalledWith("This may take 3-5 minutes...");
        expect(message.reply).toHaveBeenCalledWith("Asking AI...\n\nThis may take 3-5 minutes...");
        expect(ollamaModel.sendPrompt).toHaveBeenCalledWith("test argument");
        expect(message.reply).toHaveBeenCalledWith("AI response");
    });

    it("should send a prompt with quoted message if args are empty", async () => {
        args = [];
        ollamaModel.isServerRunning.mockResolvedValue(true);
        ollamaModel.sendPrompt.mockResolvedValue("AI response");

        await handleAddAICommand(client, message, args);

        const expectedPrompt =
            "Act as a senior SOC analyst. Given the following security alert from Wazuh, analyze the potential threat, determine its severity, and recommend remediation steps. Provide your reasoning based on best SOC practices.\n\nquoted message";

        expect(ollamaModel.sendPrompt).toHaveBeenCalledWith(expectedPrompt);
        expect(message.reply).toHaveBeenCalledWith("AI response");
    });

    describe("handleAddAICommand", () => {
        let client, message, args, chat;

        beforeEach(() => {
            client = {
                getChatById: jest.fn().mockResolvedValue({
                    sendSeen: jest.fn(),
                    sendStateTyping: jest.fn(),
                }),
            };
            message = {
                from: "testUser",
                reply: jest.fn(),
                _data: {
                    quotedMsg: {
                        body: "quoted message",
                    },
                },
            };
            args = ["test", "argument"];
            chat = {
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            };
        });

        it("should reply with 'AI server is not running.' if the server is not running", async () => {
            ollamaModel.isServerRunning.mockResolvedValue(false);

            await handleAddAICommand(client, message, args);

            expect(logger.info).toHaveBeenCalledWith("AI server is not running.");
            expect(message.reply).toHaveBeenCalledWith("AI server is not running.");
        });

        it("should log and reply with an error message if an error occurs", async () => {
            ollamaModel.isServerRunning.mockResolvedValue(false);
            message.reply.mockImplementationOnce(() => {
                throw new Error("Test error");
            });

            await handleAddAICommand(client, message, args);

            expect(logger.error).toHaveBeenCalledWith(
                "Error in handleAddAICommand:",
                expect.any(Error)
            );
            expect(message.reply).toHaveBeenCalledWith("Error in handleAddAICommand");
        });

        it("should send a prompt to the AI and reply with the response", async () => {
            ollamaModel.isServerRunning.mockResolvedValue(true);
            ollamaModel.sendPrompt.mockResolvedValue("AI response");

            await handleAddAICommand(client, message, args);

            expect(logger.info).toHaveBeenCalledWith("Asking AI...");
            expect(logger.info).toHaveBeenCalledWith("This may take 3-5 minutes...");
            expect(message.reply).toHaveBeenCalledWith("Asking AI...\n\nThis may take 3-5 minutes...");
            expect(ollamaModel.sendPrompt).toHaveBeenCalledWith("test argument");
            expect(message.reply).toHaveBeenCalledWith("AI response");
        });

        it("should send a prompt with quoted message if args are empty", async () => {
            args = [];
            ollamaModel.isServerRunning.mockResolvedValue(true);
            ollamaModel.sendPrompt.mockResolvedValue("AI response");

            await handleAddAICommand(client, message, args);

            const expectedPrompt =
                "Act as a senior SOC analyst. Given the following security alert from Wazuh, analyze the potential threat, determine its severity, and recommend remediation steps. Provide your reasoning based on best SOC practices.\n\nquoted message";

            expect(ollamaModel.sendPrompt).toHaveBeenCalledWith(expectedPrompt);
            expect(message.reply).toHaveBeenCalledWith("AI response");
        });
    });

    describe("handleSecurityRecommendation", () => {
        let req, res;

        beforeEach(() => {
            req = {
                body: {
                    body: "test logs",
                },
            };
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
        });

        it("should return 503 if the server is not running", async () => {
            ollamaModel.isServerRunning.mockResolvedValue(false);

            await handleSecurityRecommendation(req, res);

            expect(logger.info).toHaveBeenCalledWith("AI server is not running.");
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith({ code: 503, message: "AI server is not running." });
        });

        it("should send a prompt to the AI and return the response", async () => {
            ollamaModel.isServerRunning.mockResolvedValue(true);
            ollamaModel.sendPrompt.mockResolvedValue("AI recommendation");

            await handleSecurityRecommendation(req, res);

            expect(logger.info).toHaveBeenCalledWith("Asking AI for security recommendation...");
            expect(ollamaModel.sendPrompt).toHaveBeenCalledWith(
                "Provide security recommendations based on the following logs:\ntest logs"
            );
            expect(res.send).toHaveBeenCalledWith("AI recommendation");
        });
    });
});