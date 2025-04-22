const { dockerMonitor } = require("../src/models/containerMonitor");
const { exec } = require("child_process");
const logger = require("../src/helpers/logger");

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

jest.mock("../src/helpers/logger", () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

describe("dockerMonitor", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getRunningDockerContainers", () => {
        it("should return parsed container data when docker ps succeeds", async () => {
            const stdout = `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS   NAMES\n12345   test-image   "test-cmd"   2 hours ago   Up 2 hours   8080/tcp   test-container`;
            exec.mockImplementation((cmd, callback) => callback(null, stdout, ""));

            const result = await dockerMonitor.getRunningDockerContainers();

            expect(exec).toHaveBeenCalledWith('docker ps --filter "status=running"', expect.any(Function));
            expect(result).toEqual([
                {
                    NAMES: "test-container",
                    STATUS: "Up 2 hours",
                    CREATED: "2 hours ago",
                },
            ]);
        });

        it("should reject with an error when docker ps fails", async () => {
            const error = new Error("Test error");
            exec.mockImplementation((cmd, callback) => callback(error, "", ""));

            await expect(dockerMonitor.getRunningDockerContainers()).rejects.toThrow("Test error");
            expect(logger.error).toHaveBeenCalledWith("Error executing docker ps: Test error");
        });

        it("should reject with an error when stderr is returned", async () => {
            exec.mockImplementation((cmd, callback) => callback(null, "", "Test stderr"));

            await expect(dockerMonitor.getRunningDockerContainers()).rejects.toThrow("Test stderr");
            expect(logger.error).toHaveBeenCalledWith("Docker command stderr: Test stderr");
        });
    });

    describe("getExitedDockerContainers", () => {
        it("should return parsed container data when docker ps succeeds", async () => {
            const stdout = `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS   NAMES\n67890   test-image   "test-cmd"   3 hours ago   Exited 1 hour ago   8080/tcp   exited-container`;
            exec.mockImplementation((cmd, callback) => callback(null, stdout, ""));

            const result = await dockerMonitor.getExitedDockerContainers();

            expect(exec).toHaveBeenCalledWith('docker ps --filter "status=exited"', expect.any(Function));
            expect(result).toEqual([
                {
                    NAMES: "exited-container",
                    STATUS: "Exited 1 hour ago",
                    CREATED: "3 hours ago",
                },
            ]);
        });

        it("should reject with an error when docker ps fails", async () => {
            const error = new Error("Test error");
            exec.mockImplementation((cmd, callback) => callback(error, "", ""));

            await expect(dockerMonitor.getExitedDockerContainers()).rejects.toThrow("Test error");
            expect(logger.error).toHaveBeenCalledWith("Error executing docker ps: Test error");
        });

        it("should reject with an error when stderr is returned", async () => {
            exec.mockImplementation((cmd, callback) => callback(null, "", "Test stderr"));

            await expect(dockerMonitor.getExitedDockerContainers()).rejects.toThrow("Test stderr");
            expect(logger.error).toHaveBeenCalledWith("Docker command stderr: Test stderr");
        });
    });

    describe("parseDockerPsOutput", () => {
        it("should return an empty array when stdout is empty", async () => {
            const result = await dockerMonitor.parseDockerPsOutput("");
            expect(result).toEqual([]);
        });

        it("should return an empty array when stdout contains only headers", async () => {
            const stdout = "CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS   NAMES";
            const result = await dockerMonitor.parseDockerPsOutput(stdout);
            expect(result).toEqual([]);
        });

        it("should parse valid stdout and return container data", async () => {
            const stdout = `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS   NAMES\n12345   test-image   "test-cmd"   2 hours ago   Up 2 hours   8080/tcp   test-container`;
            const result = await dockerMonitor.parseDockerPsOutput(stdout);
            expect(result).toEqual([
                {
                    NAMES: "test-container",
                    STATUS: "Up 2 hours",
                    CREATED: "2 hours ago",
                },
            ]);
        });

        it("should throw an error when stdout is malformed", async () => {
            const stdout = "malformed data";
            await expect(dockerMonitor.parseDockerPsOutput(stdout)).rejects.toThrow("Malformed docker ps output");
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Malformed docker ps output"));
        });
    });

    describe("handleContainerStatus", () => {
        let client, message;

        beforeEach(() => {
            client = {};
            message = {
                reply: jest.fn(),
            };
        });

        it("should reply with no running containers when none are found", async () => {
            jest.spyOn(dockerMonitor, "getRunningDockerContainers").mockResolvedValue([]);
            jest.spyOn(dockerMonitor, "getExitedDockerContainers").mockResolvedValue([]);

            await dockerMonitor.handleContainerStatus(client, message, []);

            expect(message.reply).toHaveBeenCalledWith("No running Docker containers found");
        });

        it("should reply with running and exited containers when they exist", async () => {
            jest.spyOn(dockerMonitor, "getRunningDockerContainers").mockResolvedValue([
                { NAMES: "running-container", STATUS: "Up 2 hours", CREATED: "2 hours ago" },
            ]);
            jest.spyOn(dockerMonitor, "getExitedDockerContainers").mockResolvedValue([
                { NAMES: "exited-container", STATUS: "Exited 1 hour ago", CREATED: "3 hours ago" },
            ]);

            await dockerMonitor.handleContainerStatus(client, message, []);

            expect(message.reply).toHaveBeenCalledWith(
                "⚡ *Active Containers* ⚡\n\n*Name*: running-container\n*Status*: Up 2 hours\n*Created*: 2 hours ago"
            );
            expect(message.reply).toHaveBeenCalledWith(
                "🚨 *Exited Containers* 🚨\n\n*Name*: exited-container\n*Status*: Exited 1 hour ago\n*Created*: 3 hours ago"
            );
        });

        it("should reply with an error message when an exception occurs", async () => {
            const error = new Error("Test error");
            jest.spyOn(dockerMonitor, "getRunningDockerContainers").mockRejectedValue(error);

            await dockerMonitor.handleContainerStatus(client, message, []);

            expect(message.reply).toHaveBeenCalledWith("Error: Test error");
            expect(logger.error).toHaveBeenCalledWith("Error getting container status:", error);
        });
    });
});