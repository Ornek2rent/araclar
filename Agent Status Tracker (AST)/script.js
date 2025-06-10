let agents = [];

window.onload = () => {
  document.getElementById('fileInput').addEventListener('change', loadFile);
  loadAgents();
  setInterval(() => {
    updateAgentStatus();
    renderAgents();
  }, 60000); // Refresh every minute
};

function loadFile(event) {
  const reader = new FileReader();
  reader.onload = function () {
    agents = JSON.parse(reader.result);
    updateAgentStatus();
    renderAgents();
  };
  reader.readAsText(event.target.files[0]);
}

function loadAgents() {
  document.getElementById('fileInput').click();
}

function renderAgents() {
  const container = document.getElementById('agent-list');
  container.innerHTML = '';

  agents.forEach((agent, index) => {
    const statusClass = agent.status === 'fresh' ? 'fresh' : 'depleted';

    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent';

    const tasksList = agent.tasks.map(task => `<li>${task}</li>`).join('');

    agentDiv.innerHTML = `
      <div><span class="status ${statusClass}"></span><strong>${agent.email}</strong></div>
      <div>Password: <code>${agent.password}</code></div>
      <div>Status: ${agent.status}${agent.revivalTime ? ` (Revives at ${agent.revivalTime})` : ''}</div>
      <div>Tasks:</div>
      <ul>${tasksList}</ul>

      <form onsubmit="handleTaskAdd(event, ${index})">
        <input type="text" placeholder="New Task" name="task" required />
        <button type="submit">Add Task</button>
      </form>

      <form onsubmit="handleRevivalUpdate(event, ${index})">
        <input type="time" name="revival" value="${agent.revivalTime || ''}" />
        <button type="submit">Set Revival</button>
      </form>

      <form onsubmit="handleToggleStatus(event, ${index})">
        <button type="submit">Toggle Status</button>
      </form>
    `;

    container.appendChild(agentDiv);
  });
}

function updateAgentStatus() {
  const now = new Date();
  agents.forEach(agent => {
    if (agent.status === 'depleted' && agent.revivalTime) {
      const [h, m] = agent.revivalTime.split(':').map(Number);
      const revivalTime = new Date();
      revivalTime.setHours(h, m, 0, 0);
      if (now > revivalTime) {
        agent.status = 'fresh';
        agent.revivalTime = '';
      }
    }
  });
}

function confirmSessionRefresh() {
  if (confirm("Are you sure you want to refresh session data? This will clear all tasks and statuses.")) {
    agents.forEach(agent => {
      agent.tasks = [];
      agent.status = 'fresh';
      agent.revivalTime = '';
    });
    renderAgents();
  }
}

function confirmCredentialUpdate() {
  if (confirm("Are you sure you want to update credentials? Please re-upload the JSON file.")) {
    loadAgents();
  }
}

function exportToJSON() {
  const jsonString = JSON.stringify(agents, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `agents-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Form Handlers
function handleTaskAdd(event, index) {
  event.preventDefault();
  const task = event.target.task.value.trim();
  if (task) {
    agents[index].tasks.push(task);
    event.target.reset();
    renderAgents();
  }
}

function handleRevivalUpdate(event, index) {
  event.preventDefault();
  const revivalTime = event.target.revival.value;
  if (revivalTime) {
    agents[index].revivalTime = revivalTime;
    agents[index].status = 'depleted';
    renderAgents();
  }
}

function handleToggleStatus(event, index) {
  event.preventDefault();
  const agent = agents[index];
  agent.status = agent.status === 'fresh' ? 'depleted' : 'fresh';
  if (agent.status === 'fresh') agent.revivalTime = '';
  renderAgents();
}
