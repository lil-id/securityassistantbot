const {
    handleBotnetCheck,
    fetchAndCompareIPs,
    startBotnetCheck,
} = require("../src/controllers/handleBotnetCheck");
const axios = require("axios");
const fs = require("fs");
const logger = require("../src/helpers/logger");

jest.mock("axios");
jest.mock("fs", () => ({
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn(() => "192.168.1.1\n"),
    appendFileSync: jest.fn(),
}));

jest.mock("path", () => {
    const actualPath = jest.requireActual("path");
    return {
        ...actualPath,
        join: jest.fn(() => "/mocked/path/malicious_ips.txt"),
    };
});


jest.mock("../src/helpers/logger");

jest.useFakeTimers(); // Mock timers
jest.spyOn(global, "setInterval");

jest.setTimeout(60000); // Increase timeout globally

describe("handleBotnetCheck", () => {
    let client, message, args;

    beforeEach(() => {
        jest.clearAllMocks();
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };
        message = {
            from: "testUser",
            reply: jest.fn(),
        };
        args = [];
    });

    it("should fetch and reply with malicious IPs", async () => {
        const mockData = [
            {
                ip_address: "192.168.1.1",
                port: "80",
                status: "active",
                hostname: "example.com",
                as_number: "12345",
                as_name: "Example AS",
                country: "US",
                first_seen: "2023-01-01",
                last_online: "2023-01-02",
                malware: "ExampleMalware",
            },
        ];
        axios.get.mockResolvedValue({ data: mockData });

        await handleBotnetCheck(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        expect(message.reply).toHaveBeenCalledWith(
            expect.stringContaining("Malicious IPs Botnet List:")
        );
    });

    it("should reply with no malicious IPs found", async () => {
        axios.get.mockResolvedValue({ data: [] });

        await handleBotnetCheck(client, message, args);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        expect(message.reply).toHaveBeenCalledWith(
            "Currently no malicious IPs botnet found from feodotracker.abuse.ch"
        );
    });

    it("should handle errors gracefully", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await handleBotnetCheck(client, message, args);

        expect(logger.error).toHaveBeenCalledWith(
            "Error in handleBotnetCheck:",
            expect.any(Error)
        );
        expect(message.reply).toHaveBeenCalledWith(
            "Error checking malicious IP botnet"
        );
    });
});

describe("fetchAndCompareIPs", () => {
    let client, groups;

    beforeEach(() => {
        jest.clearAllMocks();
        client = { sendMessage: jest.fn() };
        groups = { alertTrigger: "testGroup" };
    });

    it("should fetch and compare IPs, and send new malicious IPs", async () => {
        const mockData = [
            { ip_address: "192.168.1.1" },
            { ip_address: "192.168.1.2" },
        ];
        axios.get.mockResolvedValue({ data: mockData });
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue("192.168.1.1\n");

        await fetchAndCompareIPs(client, groups);

        expect(fs.appendFileSync).toHaveBeenCalledWith(
            expect.any(String),
            "192.168.1.2\n",
            "utf-8"
        );
        expect(client.sendMessage).toHaveBeenCalledWith(
            groups.alertTrigger,
            expect.stringContaining("New Malicious IPs Botnet List:")
        );
    });

    it("should log no new malicious IPs found", async () => {
        const mockData = [{ ip_address: "192.168.1.1" }];
        axios.get.mockResolvedValue({ data: mockData });
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue("192.168.1.1\n");

        await fetchAndCompareIPs(client, groups);

        expect(logger.info).toHaveBeenCalledWith("No new malicious IPs found.");
    });

    it("should handle errors gracefully", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));

        await fetchAndCompareIPs(client, groups);

        expect(logger.error).toHaveBeenCalledWith(
            "Error in fetchAndCompareIPs:",
            expect.any(Error)
        );
    });
});

describe("startBotnetCheck", () => {
    let client, groups, mockFetchAndCompareIPs, intervalId;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        client = { sendMessage: jest.fn() };
        groups = { alertTrigger: "testGroup" };
        mockFetchAndCompareIPs = jest.fn();
    });

    afterEach(() => {
        if (intervalId) clearInterval(intervalId);
        jest.clearAllTimers();
    });

    it("should call fetchAndCompareIPs immediately and then at regular intervals", () => {
        const testInterval = 100; // Mock interval for fast execution

        intervalId = startBotnetCheck(
            client,
            groups,
            testInterval,
            mockFetchAndCompareIPs
        );

        // Ensure immediate execution
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(1);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledWith(client, groups);

        // Advance to the first interval
        jest.advanceTimersByTime(testInterval);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(2);

        // Advance to the second interval
        jest.advanceTimersByTime(testInterval);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(3);
    });

    it("should use default interval if not provided", () => {
        const testDefaultInterval = 100; // Default interval

        intervalId = startBotnetCheck(
            client,
            groups,
            undefined,
            mockFetchAndCompareIPs
        );

        // Ensure immediate execution
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(1);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledWith(client, groups);

        // Fast-forward time
        jest.advanceTimersByTime(testDefaultInterval);
        jest.runOnlyPendingTimers();

        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(testDefaultInterval);
        jest.runOnlyPendingTimers();

        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(3);
    });
});
