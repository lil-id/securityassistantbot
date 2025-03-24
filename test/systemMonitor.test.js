const {
    getCPUUsage,
    getMemoryUsage,
    getStorageUsage,
    getSystemStats,
    startMonitoring,
    stopMonitoring,
    THRESHOLDS
} = require("../src/models/systemMonitor");

const logger = require("../src/helpers/logger");
const { alertChecker } = require("../src/helpers/alertChecker");

jest.mock("util", () => {
    const execMock = jest.fn();
    return { promisify: () => execMock };
});
const execPromise = require("util").promisify();

jest.mock("../src/helpers/logger", () => ({
    info: jest.fn(),
    error: jest.fn()
}));

jest.mock("../src/helpers/alertChecker", () => ({
    alertChecker: {
        getAlertLevel: jest.fn(),
        getAlertEmoji: jest.fn()
    }
}));

describe("systemMonitor", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        alertChecker.getAlertLevel.mockReturnValue("warning");
        alertChecker.getAlertEmoji.mockReturnValue("⚠️");
    });

    describe("getMemoryUsage", () => {
        it("should return memory usage with alert level and formatted string", async () => {
            execPromise.mockResolvedValueOnce({ stdout: "8000000\n" }); // Total memory KB
            execPromise.mockResolvedValueOnce({ stdout: "4000000\n" }); // Used memory KB
            execPromise.mockResolvedValueOnce({ stdout: "Mem: 7.8G 3.9G 3.9G\n" });

            const result = await getMemoryUsage();

            expect(logger.info).toHaveBeenCalledWith("Getting Memory usage");
            expect(alertChecker.getAlertLevel).toHaveBeenCalledWith(expect.any(Number), THRESHOLDS.memory);
            expect(result.formattedString).toMatch(/\*Memory\*:/);
        });
    });

    describe("getStorageUsage", () => {
        it("should return storage usage correctly", async () => {
            execPromise.mockResolvedValue({ stdout: "/dev/sda1 50G 25G 25G 50%\n" });

            const result = await getStorageUsage();

            expect(logger.info).toHaveBeenCalledWith("Getting Storage usage");
            expect(alertChecker.getAlertLevel).toHaveBeenCalledWith(expect.any(Number), THRESHOLDS.storage);
            expect(result.formattedString).toMatch(/\*Storage\*:/);
        });
    });

    describe("getSystemStats", () => {
        it("should return system stats with alerts", async () => {
            execPromise.mockResolvedValueOnce({ stdout: "75.0\n" }); // CPU
            execPromise.mockResolvedValueOnce({ stdout: "8000000\n" });
            execPromise.mockResolvedValueOnce({ stdout: "4000000\n" });
            execPromise.mockResolvedValueOnce({ stdout: "Mem: 7.8G 3.9G 3.9G\n" });
            execPromise.mockResolvedValueOnce({ stdout: "/dev/sda1 50G 25G 25G 50%\n" });

            const result = await getSystemStats();

            expect(logger.info).toHaveBeenCalledWith("Getting system stats");
            expect(result.hasAlerts).toBe(true);
            expect(result.alerts.length).toBeGreaterThan(0);
        });
    });
});
