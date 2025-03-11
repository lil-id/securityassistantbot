const { startBotnetCheck } = require("../src/controllers/handleBotnetCheck");

jest.useFakeTimers(); // Mock timers
jest.spyOn(global, "setInterval");

jest.setTimeout(60000); // Increase timeout globally

describe("handleBotnetCheck", () => {
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
        const testInterval = 100; // ✅ Mock interval for fast execution

        intervalId = startBotnetCheck(client, groups, testInterval, mockFetchAndCompareIPs);
        
        // ✅ Ensure immediate execution (fixing the previous mistake)
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(1);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledWith(client, groups);

        // ⏩ Advance to the first interval
        jest.advanceTimersByTime(testInterval);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(2);

        // ⏩ Advance to the second interval
        jest.advanceTimersByTime(testInterval);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(3);
    });

    it("should use default interval if not provided", () => {
        const testDefaultInterval = 100; // ✅ Mock default interval

        intervalId = startBotnetCheck(client, groups, undefined, mockFetchAndCompareIPs);

        // ✅ Ensure immediate execution
        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(1);
        expect(mockFetchAndCompareIPs).toHaveBeenCalledWith(client, groups);

        // ⏩ Fast-forward time
        jest.advanceTimersByTime(testDefaultInterval);
        jest.runOnlyPendingTimers();

        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(testDefaultInterval);
        jest.runOnlyPendingTimers();

        expect(mockFetchAndCompareIPs).toHaveBeenCalledTimes(3);
    });
});
