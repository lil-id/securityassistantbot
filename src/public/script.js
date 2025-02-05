const socket = io();

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('alert', (alert) => {
    const alertList = document.getElementById("alertList");
    const row = document.createElement("tr");
    const timestampCell = document.createElement("td");
    const agentCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const levelCell = document.createElement("td");
    const srcIpCell = document.createElement("td");
    const groupsCell = document.createElement("td");
    const fullLogCell = document.createElement("td");

    timestampCell.textContent = alert.timestamp;
    agentCell.textContent = alert.agent;
    descriptionCell.textContent = alert.description;
    levelCell.textContent = alert.level;
    srcIpCell.textContent = alert.src_ip;
    groupsCell.textContent = alert.groups.join(', ');
    fullLogCell.textContent = alert.full_log;

    row.appendChild(timestampCell);
    row.appendChild(agentCell);
    row.appendChild(descriptionCell);
    row.appendChild(levelCell);
    row.appendChild(srcIpCell);
    row.appendChild(groupsCell);
    row.appendChild(fullLogCell);
    alertList.appendChild(row);
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});

async function fetchAlerts(ip) {
    const response = await fetch(`/api/v1/wazuh/alerts/${ip}`);
    const alerts = await response.json();
    const alertList = document.getElementById("alertList");
    alertList.innerHTML = ''; // Clear existing alerts
    alerts.forEach(alert => {
        const row = document.createElement("tr");
        const timestampCell = document.createElement("td");
        const agentCell = document.createElement("td");
        const descriptionCell = document.createElement("td");
        const levelCell = document.createElement("td");
        const srcIpCell = document.createElement("td");
        const groupsCell = document.createElement("td");
        const fullLogCell = document.createElement("td");

        timestampCell.textContent = alert.timestamp;
        agentCell.textContent = alert.agent;
        descriptionCell.textContent = alert.description;
        levelCell.textContent = alert.level;
        srcIpCell.textContent = alert.src_ip;
        groupsCell.textContent = alert.groups.join(', ');
        fullLogCell.textContent = alert.full_log;

        row.appendChild(timestampCell);
        row.appendChild(agentCell);
        row.appendChild(descriptionCell);
        row.appendChild(levelCell);
        row.appendChild(srcIpCell);
        row.appendChild(groupsCell);
        row.appendChild(fullLogCell);
        alertList.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const fetchButton = document.getElementById("fetchAlertsButton");
    fetchButton.addEventListener("click", handleFetchAlerts);
});

function handleFetchAlerts() {
    const ipInput = document.getElementById("ipInput").value;
    fetchAlerts(ipInput);
}