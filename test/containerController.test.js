const { handleContainerStatus } = require("../src/controllers/containerController");
const { getRunningDockerContainers, getExitedDockerContainers } = require("../src/models/containerMonitor");
const logger = require("../src/helpers/logger");

jest.mock("../src/models/containerMonitor");
jest.mock("../src/helpers/logger");

describe("handleContainerStatus", () => {
	let client, message;

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
		};
	});

	it("should reply with active containers", async () => {
		const args = ["active"];
		const containers = [
			{ Names: ["container1"], Status: "running", Created: 1633036800 },
		];
		getRunningDockerContainers.mockResolvedValue(containers);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith(
			"Active Containers\n\n🔖 *Name*: container1\n🪅 *Status*: running\n⏰ *Created*: 10/1/2021, 5:20:00 AM"
		);
	});

	it("should reply with exited containers", async () => {
		const args = ["exited"];
		const containers = [
			{ Names: ["container2"], Status: "exited", Created: 1633036800 },
		];
		getExitedDockerContainers.mockResolvedValue(containers);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith(
			"Exited Containers\n\n🔖 *Name*: container2\n🪅 *Status*: exited\n⏰ *Created*: 10/1/2021, 5:20:00 AM"
		);
	});

	it("should reply with no active containers found", async () => {
		const args = ["active"];
		getRunningDockerContainers.mockResolvedValue([]);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(logger.info).toHaveBeenCalledWith("No Active Docker containers found");
		expect(message.reply).toHaveBeenCalledWith("No Active Docker containers found");
	});

	it("should reply with no exited containers found", async () => {
		const args = ["exited"];
		getExitedDockerContainers.mockResolvedValue([]);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(logger.info).toHaveBeenCalledWith("No Exited Docker containers found");
		expect(message.reply).toHaveBeenCalledWith("No Exited Docker containers found");
	});

	it("should reply with an error message on invalid argument", async () => {
		const args = ["invalid"];

		await handleContainerStatus(client, message, args);

		expect(message.reply).toHaveBeenCalledWith(
			"Please provide a valid argument:\n\n`!container active` - Get active containers\n`!container exited` - Get exited containers"
		);
	});

	it("should reply with an error message on exception", async () => {
		const args = ["active"];
		const error = new Error("Test error");
		getRunningDockerContainers.mockRejectedValue(error);

		await handleContainerStatus(client, message, args);

		expect(logger.error).toHaveBeenCalledWith("Error getting container status:", error);
		expect(message.reply).toHaveBeenCalledWith(`Error: ${error.message}`);
	});
});