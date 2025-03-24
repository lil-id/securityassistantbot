const { prisma } = require("../src/helpers/databaseConnection");
const logger = require("../src/helpers/logger");
const { reportBot } = require("../src/models/reportModel");

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        users: { findMany: jest.fn(), create: jest.fn() },
        admins: { findMany: jest.fn(), create: jest.fn() },
        reportAdmins: { findMany: jest.fn(), create: jest.fn() },
        reportUsers: { findMany: jest.fn(), create: jest.fn() },
    },
}));
jest.mock("../src/helpers/logger");

describe("reportBot", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserIds", () => {
        it("should return user IDs for given phone numbers", async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: "Admin1", role: "admin", numberPhone: "12345" },
            ]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: "User1", role: "user", numberPhone: "67890" },
            ]);

            const result = await reportBot.getUserIds(["12345", "67890"]);
            expect(result).toEqual([
                { id: 1, name: "Admin1", role: "admin" },
                { id: 2, name: "User1", role: "user" },
            ]);
        });

        it("should return an empty array if no users or admins found", async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([]);

            const result = await reportBot.getUserIds(["12345"]);
            expect(result).toEqual([]);
        });
    });

    describe("createReport", () => {
        it("should create a report for an admin", async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: "Admin1", role: "admin", numberPhone: "12345" },
            ]);
            prisma.users.findMany.mockResolvedValue([]);
            prisma.reportAdmins.create.mockResolvedValue({});

            await reportBot.createReport("12345", "evidence", "report");

            expect(prisma.reportAdmins.create).toHaveBeenCalledWith({
                data: {
                    idAdmin: 1,
                    name: "Admin1",
                    evidence: "evidence",
                    report: "report",
                },
            });
        });

        it("should create a report for a user", async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: "User1", role: "user", numberPhone: "67890" },
            ]);
            prisma.reportUsers.create.mockResolvedValue({});

            await reportBot.createReport("67890", "evidence", "report");

            expect(prisma.reportUsers.create).toHaveBeenCalledWith({
                data: {
                    idUser: 2,
                    name: "User1",
                    evidence: "evidence",
                    report: "report",
                },
            });
        });
    });

    describe("getReports", () => {
        it("should return formatted reports", async () => {
            prisma.reportAdmins.findMany.mockResolvedValue([
                {
                    id: 1,
                    name: "Admin1",
                    report: "report1",
                    admin: { name: "Admin1", numberPhone: "12345" },
                },
            ]);
            prisma.reportUsers.findMany.mockResolvedValue([
                {
                    id: 2,
                    name: "User1",
                    report: "report2",
                    user: { name: "User1", numberPhone: "67890" },
                },
            ]);

            const result = await reportBot.getReports();
            expect(result).toContain("📝 *Report #1*");
            expect(result).toContain("👤 *Name:* Admin1");
            expect(result).toContain("📱 *Phone:* 12345");
            expect(result).toContain("💬 *Message:* report1");
            expect(result).toContain("📝 *Report #2*");
            expect(result).toContain("👤 *Name:* User1");
            expect(result).toContain("📱 *Phone:* 67890");
            expect(result).toContain("💬 *Message:* report2");
        });

        it("should return 'No report available.' if no reports found", async () => {
            prisma.reportAdmins.findMany.mockResolvedValue([]);
            prisma.reportUsers.findMany.mockResolvedValue([]);

            const result = await reportBot.getReports();
            expect(result).toBe("No report available.");
        });
    });

    describe("getReportById", () => {
        it("should return formatted reports for given user phone numbers", async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: "Admin1", role: "admin", numberPhone: "12345" },
            ]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: "User1", role: "user", numberPhone: "67890" },
            ]);
            prisma.reportAdmins.findMany.mockResolvedValue([
                {
                    id: 1,
                    name: "Admin1",
                    report: "report1",
                    admin: { name: "Admin1", numberPhone: "12345" },
                },
            ]);
            prisma.reportUsers.findMany.mockResolvedValue([
                {
                    id: 2,
                    name: "User1",
                    report: "report2",
                    user: { name: "User1", numberPhone: "67890" },
                },
            ]);

            const result = await reportBot.getReportById(["12345", "67890"]);
            expect(result).toContain("📝 *Report #1*");
            expect(result).toContain("👤 *Name:* Admin1");
            expect(result).toContain("📱 *Phone:* 12345");
            expect(result).toContain("💬 *Message:* report1");
            expect(result).toContain("📝 *Report #2*");
            expect(result).toContain("👤 *Name:* User1");
            expect(result).toContain("📱 *Phone:* 67890");
            expect(result).toContain("💬 *Message:* report2");
        });

        it("should return 'No report available.' if no reports found for given user phone numbers", async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([]);
            prisma.reportAdmins.findMany.mockResolvedValue([]);
            prisma.reportUsers.findMany.mockResolvedValue([]);

            const result = await reportBot.getReportById(["12345"]);
            expect(result).toBe("No report available.");
        });
    });
});