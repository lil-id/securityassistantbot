const { handleReport } = require("../src/controllers/reportController");
const { reportBot } = require("../src/models/reportModel");
const { checkRoles } = require("../src/helpers/rolesChecker");
const logger = require("../src/helpers/logger");

jest.mock("../src/helpers/logger");
jest.mock("../src/models/reportModel");
jest.mock("../src/helpers/rolesChecker");

describe("handleReport", () => {
    let client, message;

    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };

        message = {
            from: "12345",
            author: "67890",
            mentionedIds: [],
            getMentions: jest.fn().mockResolvedValue([]),
            reply: jest.fn(),
            _data: {
                quotedMsg: null,
            },
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });    

    it("should send seen and typing state", async () => {
        await handleReport(client, message, []);
        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        const chat = await client.getChatById.mock.results[0].value;
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
    });

    it("should reply with all reports if user is admin and message is 'all'", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });
        reportBot.getReports.mockResolvedValue("Report 1, Report 2");

        await handleReport(client, message, ["all"]);

        expect(reportBot.getReports).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith("All reports:\n\nReport 1, Report 2");
    });

    it("should reply with specific report if user is admin and phone number is mentioned", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });
        message.mentionedIds = ["12345"];
        reportBot.getReportById.mockResolvedValue("Specific report");

        await handleReport(client, message, []);

        expect(reportBot.getReportById).toHaveBeenCalledWith(["12345"]);
        expect(message.reply).toHaveBeenCalledWith("Report from :\n\nSpecific report");
    });

    it("should create a report if user is admin and report message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "admin" });

        await handleReport(client, message, ["Issue description"]);

        expect(reportBot.createReport).toHaveBeenCalledWith(
            message.author,
            "No evidence provided",
            "Issue description"
        );
        expect(message.reply).toHaveBeenCalledWith("Report received. We will investigate the issue.");
    });

    it("should create a report if user is not admin and report message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "user" });

        await handleReport(client, message, ["Issue description"]);

        expect(reportBot.createReport).toHaveBeenCalledWith(
            message.author,
            "No evidence provided",
            "Issue description"
        );
        expect(message.reply).toHaveBeenCalledWith("Report received. We will investigate the issue.");
    });

    it("should reply with an error message if no report message is provided", async () => {
        checkRoles.mockResolvedValue({ role: "user" });

        await handleReport(client, message, []);

        expect(message.reply).toHaveBeenCalledWith(
            "Please provide report details or provide argument text.\n\n*!report* issue description\n"
        );
    });

    it("should handle errors gracefully", async () => {
        const error = new Error("Test error");
        client.getChatById.mockRejectedValue(error);

        await handleReport(client, message, []);

        expect(logger.error).toHaveBeenCalledWith("Error handling report:", error);
    });
});