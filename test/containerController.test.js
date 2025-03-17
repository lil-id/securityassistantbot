const { handleContainerStatus } = require("../src/controllers/containerController");
const { dockerMonitor } = require("../src/models/containerMonitor");
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

	it("should reply with active containers when 'active' is passed", async () => {
		const args = ["active"];
		const containers = [
			{ NAMES: "container1", STATUS: "running", CREATED: "10 minutes ago" },
			{ NAMES: "container2", STATUS: "running", CREATED: "5 minutes ago" },
		];
		dockerMonitor.getRunningDockerContainers.mockResolvedValue(containers);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith(
			`Active Containers\n\n🔖 *Name*: container1\n🪅 *Status*: running\n⏰ *Created*: 10 minutes ago\n\n🔖 *Name*: container2\n🪅 *Status*: running\n⏰ *Created*: 5 minutes ago`
		);
	});

	it("should reply with no active containers found when there are no active containers", async () => {
		const args = ["active"];
		dockerMonitor.getRunningDockerContainers.mockResolvedValue([]);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith("No active Docker containers found");
	});

	it("should reply with exited containers when 'exited' is passed", async () => {
		const args = ["exited"];
		const containers = [
			{ NAMES: "container1", STATUS: "exited", CREATED: "2 hours ago" },
			{ NAMES: "container2", STATUS: "exited", CREATED: "1 hour ago" },
		];
		dockerMonitor.getExitedDockerContainers.mockResolvedValue(containers);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith(
			`Exited Containers\n\n🔖 *Name*: container1\n🪅 *Status*: exited\n⏰ *Created*: 2 hours ago\n\n🔖 *Name*: container2\n🪅 *Status*: exited\n⏰ *Created*: 1 hour ago`
		);
	});

	it("should reply with no exited containers found when there are no exited containers", async () => {
		const args = ["exited"];
		dockerMonitor.getExitedDockerContainers.mockResolvedValue([]);

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith("No exited Docker containers found");
	});

	it("should reply with usage instructions when an invalid argument is passed", async () => {
		const args = ["invalid"];

		await handleContainerStatus(client, message, args);

		expect(client.getChatById).toHaveBeenCalledWith(message.from);
		expect(message.reply).toHaveBeenCalledWith(
			"Please provide argument text.\n\n`!container active` - Get active containers \n`!container exited` - Get exited containers"
		);
	});

	it("should reply with an error message when an error occurs", async () => {
		const args = ["active"];
		const error = new Error("Test error");
		client.getChatById.mockRejectedValue(error);

		await handleContainerStatus(client, message, args);

		expect(logger.error).toHaveBeenCalledWith("Error getting container status:", error);
		expect(message.reply).toHaveBeenCalledWith(`Error: ${error.message}`);
	});
});