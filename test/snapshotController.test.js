const { handleSnapshot } = require("../src/controllers/snapshotController");
const { startCronJob, validateCronSchedule } = require("../src/helpers/cronHelper");
const { prisma } = require("../src/helpers/databaseConnection");
const logger = require("../src/helpers/logger");
const { exec } = require("child_process");
const { appState } = require("../app");

const mockStop = jest.fn();
appState.cronJobRef = { current: { stop: mockStop } }

jest.mock("../src/helpers/cronHelper", () => ({
    startCronJob: jest.fn(),
    validateCronSchedule: jest.fn().mockReturnValue(true),
}));

jest.mock('../app', () => ({
    appState: {
      cronJobRef: {
        stop: jest.fn()
      }
    }
}));

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
      // Mock the Prisma methods you need
      cronJobsSchedule: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({})
      }
    },
    checkDatabaseConnection: jest.fn()
}));

jest.mock("../src/helpers/databaseConnection", () => ({
    prisma: {
        cronJobsSchedule: {
            upsert: jest.fn().mockResolvedValue({}),
        },
    },
}));

jest.mock("../src/helpers/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

jest.mock("child_process", () => ({
    exec: jest.fn((cmd, options, callback) => {
        callback(null, "stdout", "Minor issue"); // Simulate stderr output
    }),
}));

describe("handleSnapshot", () => {
    let client, message, groups, cronJobRef;

    beforeEach(() => {
        jest.clearAllMocks(); // ✅ Clears previous calls
        jest.resetModules(); // ✅ Resets the module cache (important if issues persist)
    
        startCronJob.mockReturnValue({
            stop: jest.fn(), // ✅ Ensure stop() function exists
        });

        // startCronJob.mockReturnValue({ stop: mockStopFunction });
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
            sendMessage: jest.fn(),
        };
    
        message = {
            from: "12345",
            reply: jest.fn(),
        };
    
        groups = {
            member: "group1",
            alertTrigger: "group2",
        };
    
        appState.cronJobRef = { current: { stop: jest.fn() } };
    
        jest.clearAllMocks();
    });
    

    test("should update the cron schedule when valid arguments are provided", async () => {
        validateCronSchedule.mockReturnValue(true);
        const stopSpy = jest.spyOn(appState.cronJobRef.current, "stop");

        await handleSnapshot(client, message, ["59", "23", "*", "*", "*"], groups, cronJobRef);
        
        expect(validateCronSchedule).toHaveBeenCalledWith("59 23 * * *");
        expect(stopSpy).toHaveBeenCalledTimes(1);
        expect(startCronJob).toHaveBeenCalledWith("59 23 * * *", client, groups);
        expect(prisma.cronJobsSchedule.upsert).toHaveBeenCalledWith({
            where: { id: 1 },
            update: {
                hourMinute: "59 23",
                dayOfMonth: "*",
                month: "*",
                dayOfWeek: "*",
            },
            create: {
                id: 1,
                hourMinute: "59 23",
                dayOfMonth: "*",
                month: "*",
                dayOfWeek: "*",
            },
        });
        expect(message.reply).toHaveBeenCalledWith("Cron schedule successfully updated to: 59 23 * * *");
    });

    test("should log and reply with an error message if snapshot script execution fails", async () => {
        exec.mockImplementation((cmd, options, callback) => {
            callback(new Error("Snapshot failed"), "", "");
        });

        await handleSnapshot(client, message, [], groups, cronJobRef);

        expect(logger.error).toHaveBeenCalledWith("Error creating snapshot: Snapshot failed");
        expect(message.reply).toHaveBeenCalledWith("Error creating snapshot: Snapshot failed");
    });

    test("should log a warning if snapshot script returns stderr", async () => {
        exec.mockImplementation((cmd, options, callback) => {
            callback(null, "stdout", "Minor issue");
        });

        await handleSnapshot(client, message, [], groups, cronJobRef);

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Minor issue"));
        expect(message.reply).toHaveBeenCalledWith("Successfully created and uploaded snapshot to Cloud Storage.");
    });
});