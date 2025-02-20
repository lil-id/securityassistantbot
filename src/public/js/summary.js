document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/api/v1/wazuh/alerts/summary');
    const alerts = await response.json();

    const ipCounts = alerts.reduce((acc, alert) => {
        if (!acc[alert.src_ip]) {
            acc[alert.src_ip] = { count: 0, agent: alert.agent, level: alert.level };
        }
        acc[alert.src_ip].count += 1;
        acc[alert.src_ip].level = Math.max(acc[alert.src_ip].level, alert.level); // Keep the highest level
        return acc;
    }, {});

    const summaryList = document.getElementById("summaryList");
    const sortedEntries = Object.entries(ipCounts).sort((a, b) => b[1].count - a[1].count || b[1].level - a[1].level);

    for (const [ip, data] of sortedEntries) {
        const row = document.createElement("tr");
        const ipCell = document.createElement("td");
        const countCell = document.createElement("td");
        const agentCell = document.createElement("td");
        const levelCell = document.createElement("td");

        ipCell.textContent = ip;
        countCell.textContent = data.count;
        agentCell.textContent = data.agent;
        levelCell.textContent = data.level;

        row.appendChild(ipCell);
        row.appendChild(countCell);
        row.appendChild(agentCell);
        row.appendChild(levelCell);
        summaryList.appendChild(row);
    }
});