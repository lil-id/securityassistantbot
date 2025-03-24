const { dockerMonitor } = require("../src/models/containerMonitor");
const { exec } = require("child_process");
const logger = require("../src/helpers/logger");

jest.mock("child_process");
jest.mock("../src/helpers/logger");

describe("dockerMonitor", () => {
    describe("parseDockerPsOutput", () => {
        it("should return an empty array if stdout is empty", async () => {
            const result = await dockerMonitor.parseDockerPsOutput("");
            expect(result).toEqual([]);
        });

        it("should return an empty array if stdout has only the header", async () => {
            const stdout = "CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES";
            const result = await dockerMonitor.parseDockerPsOutput(stdout);
            expect(result).toEqual([]);
        });

        it("should parse docker ps output correctly", async () => {
            const stdout = `CONTAINER ID   IMAGE       COMMAND      CREATED       STATUS       PORTS      NAMES
                            abc123         my-image   "/bin/bash"   2 days ago   Up 2 days   80/tcp     my-container`;

            const result = await dockerMonitor.parseDockerPsOutput(stdout);
            
            expect(result).toEqual([
                { 
                    NAMES: "my-container", 
                    STATUS: "Up 2 days", 
                    CREATED: "2 days ago" 
                }
            ]);
        });

        it("should handle multiple containers", async () => {
            const stdout = `CONTAINER ID   IMAGE       COMMAND      CREATED       STATUS            PORTS      NAMES
                            abc123         my-image   "/bin/bash"   2 days ago   Up 2 days        80/tcp     running-container
                            xyz456         test-img   "/start.sh"   3 days ago   Exited 1 day ago  443/tcp    exited-container`;

            const result = await dockerMonitor.parseDockerPsOutput(stdout);

            expect(result).toEqual([
                { 
                    NAMES: "running-container", 
                    STATUS: "Up 2 days", 
                    CREATED: "2 days ago" 
                },
                { 
                    NAMES: "exited-container", 
                    STATUS: "Exited 1 day ago", 
                    CREATED: "3 days ago" 
                }
            ]);
        });

        it("should handle errors during parsing", async () => {
            const stdout = `CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
                            abc123         my-image   "/bin/bash"   2 days ago   Up 2 days   80/tcp   my-container`;

            jest.spyOn(logger, "error").mockImplementation(() => {});
            const result = await dockerMonitor.parseDockerPsOutput(stdout);

            expect(result).toEqual([
                { 
                    NAMES: "my-container", 
                    STATUS: "Up 2 days", 
                    CREATED: "2 days ago" 
                }
            ]);
        });
    });

    describe("getRunningDockerContainers", () => {
        it("should return running docker containers", async () => {
            const stdout = `CONTAINER ID   IMAGE       COMMAND      CREATED       STATUS       PORTS      NAMES
                            abc123         my-image   "/bin/bash"   2 days ago   Up 2 days   80/tcp     running-container`;

            exec.mockImplementation((cmd, callback) => callback(null, stdout, ""));
            const result = await dockerMonitor.getRunningDockerContainers();

            expect(result).toEqual([
                { 
                    NAMES: "running-container", 
                    STATUS: "Up 2 days", 
                    CREATED: "2 days ago" 
                }
            ]);
        });

        it("should handle errors during execution", async () => {
            const error = new Error("Execution error");
            exec.mockImplementation((cmd, callback) => callback(error, "", ""));
            await expect(dockerMonitor.getRunningDockerContainers()).rejects.toThrow("Execution error");
        });
    });

    describe("getExitedDockerContainers", () => {
        it("should return exited docker containers", async () => {
            const stdout = `CONTAINER ID   IMAGE       COMMAND      CREATED       STATUS            PORTS      NAMES
                            xyz456         my-image   "/bin/bash"   3 days ago   Exited 2 days ago  80/tcp     exited-container`;

            exec.mockImplementation((cmd, callback) => callback(null, stdout, ""));
            const result = await dockerMonitor.getExitedDockerContainers();

            expect(result).toEqual([
                { 
                    NAMES: "exited-container", 
                    STATUS: "Exited 2 days ago", 
                    CREATED: "3 days ago" 
                }
            ]);
        });

        it("should handle errors during execution", async () => {
            const error = new Error("Execution error");
            exec.mockImplementation((cmd, callback) => callback(error, "", ""));
            await expect(dockerMonitor.getExitedDockerContainers()).rejects.toThrow("Execution error");
        });
    });
});
