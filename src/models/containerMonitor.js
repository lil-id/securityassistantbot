const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const getRunningDockerContainers = async () => {
    try {
        const containers = await docker.listContainers({ all: true });
        return containers.filter(container => container.State === "running");
    } catch (error) {
        console.error("Error fetching running containers:", error);
        return [];
    }
};

const getExitedDockerContainers = async () => {
    try {
        const containers = await docker.listContainers({ all: true });
        return containers.filter(container => container.State === "exited");
    } catch (error) {
        console.error("Error fetching exited containers:", error);
        return [];
    }
};

module.exports = { getRunningDockerContainers, getExitedDockerContainers };
