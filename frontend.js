// Global Application State
let processes = [];
let processColors = {};
const BACKEND_URL = 'http://localhost:5000';
let backendOnline = false;

// List of pleasant colors to assign to processes
const colorPalette = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#eab308'  // Yellow
];

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  checkBackendConnection();
  toggleAlgorithmControls();
  
  // Set up listeners for automatic recalculation
  document.getElementById('algorithm-select').addEventListener('change', runScheduler);
  document.getElementById('quantum-range').addEventListener('change', runScheduler);
  
  // Load standard preset to give immediate visual feedback
  loadPreset('standard');
});

// Check if Express backend is running
async function checkBackendConnection() {
  const badgeDot = document.getElementById('connection-status');
  const badgeText = document.getElementById('connection-text');
  
  try {
    // Ping FCFS with empty array to verify API is active
    await axios.post(`${BACKEND_URL}/api/schedule/fcfs`, { processes: [] });
    backendOnline = true;
    badgeDot.classList.add('online');
    badgeText.textContent = `Backend Server Live: ${BACKEND_URL}`;
  } catch (error) {
    backendOnline = false;
    badgeDot.classList.remove('online');
    badgeText.textContent = 'Offline Mode (Local JS Engine)';
    console.log('Backend offline. Utilizing browser-based scheduling engines.');
  }
}

// Generate color for a process ID
function getProcessColor(pid) {
  if (pid === 'Idle') return 'transparent';
  if (processColors[pid]) return processColors[pid];
  
  const index = Object.keys(processColors).length % colorPalette.length;
  processColors[pid] = colorPalette[index];
  return processColors[pid];
}

// Update Quantum Value UI slider text
function updateQuantumValue(val) {
  document.getElementById('quantum-value').textContent = val;
  runScheduler();
}

// Show/Hide controls based on chosen algorithm
function toggleAlgorithmControls() {
  const algo = document.getElementById('algorithm-select').value;
  const rrGroup = document.getElementById('rr-quantum-group');
  const preemptiveGroup = document.getElementById('preemptive-group');
  const priorityGroup = document.getElementById('priority-order-group');

  // Reset toggles
  rrGroup.style.display = 'none';
  preemptiveGroup.style.display = 'none';
  priorityGroup.style.display = 'none';

  if (algo === 'rr') {
    rrGroup.style.display = 'flex';
  } else if (algo === 'sjf') {
    preemptiveGroup.style.display = 'flex';
  } else if (algo === 'priority') {
    preemptiveGroup.style.display = 'flex';
    priorityGroup.style.display = 'flex';
  }
  
  runScheduler();
}

// Add process to pool
function addProcess() {
  const pidInput = document.getElementById('proc-id');
  const arrivalInput = document.getElementById('arrival-time');
  const burstInput = document.getElementById('burst-time');
  const priorityInput = document.getElementById('priority');

  const id = pidInput.value.trim().toUpperCase();
  const arrivalTime = parseInt(arrivalInput.value);
  const burstTime = parseInt(burstInput.value);
  const priority = parseInt(priorityInput.value) || 0;

  if (!id) return;
  
  // Validate duplicate PIDs
  if (processes.some(p => p.id === id)) {
    alert(`Process with ID ${id} already exists!`);
    return;
  }

  processes.push({ id, arrivalTime, burstTime, priority });
  
  // Reset form inputs for next process
  pidInput.value = 'P' + (processes.length + 1);
  arrivalInput.value = '0';
  burstInput.value = '5';
  priorityInput.value = '1';
  
  updateProcessPoolUI();
  runScheduler();
}

// Delete process from pool
function deleteProcess(id) {
  processes = processes.filter(p => p.id !== id);
  updateProcessPoolUI();
  runScheduler();
}

// Clear all processes
function clearProcesses() {
  processes = [];
  processColors = {};
  updateProcessPoolUI();
  hideResults();
}

// Randomize processes
function generateRandomProcesses() {
  clearProcesses();
  const count = Math.floor(Math.random() * 4) + 4; // 4 to 7 processes
  
  for (let i = 1; i <= count; i++) {
    const id = `P${i}`;
    const arrivalTime = Math.floor(Math.random() * 8); // 0 to 7
    const burstTime = Math.floor(Math.random() * 10) + 1; // 1 to 10
    const priority = Math.floor(Math.random() * 10) + 1; // 1 to 10
    processes.push({ id, arrivalTime, burstTime, priority });
  }

  updateProcessPoolUI();
  runScheduler();
}

// Load presets
function loadPreset(type) {
  clearProcesses();
  
  if (type === 'convoy') {
    // Long process arrives first, followed by tiny ones
    processes = [
      { id: 'P1', arrivalTime: 0, burstTime: 24, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 2 }
    ];
  } else if (type === 'standard') {
    processes = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 4 },
      { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 }
    ];
  } else if (type === 'priority') {
    processes = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 3, priority: 5 },
      { id: 'P4', arrivalTime: 3, burstTime: 1, priority: 4 },
      { id: 'P5', arrivalTime: 4, burstTime: 5, priority: 2 }
    ];
  } else if (type === 'sjf-test') {
    processes = [
      { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 },
      { id: 'P2', arrivalTime: 2, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 4, burstTime: 1, priority: 1 },
      { id: 'P4', arrivalTime: 5, burstTime: 4, priority: 1 }
    ];
  }

  // Set the next PID helper input in the form
  document.getElementById('proc-id').value = 'P' + (processes.length + 1);

  updateProcessPoolUI();
  runScheduler();
}

// Update local sidebar list
function updateProcessPoolUI() {
  const container = document.getElementById('process-pool');
  const emptyLabel = document.getElementById('process-list-empty');
  container.innerHTML = '';

  if (processes.length === 0) {
    emptyLabel.style.display = 'block';
    return;
  }
  
  emptyLabel.style.display = 'none';

  processes.forEach(p => {
    const color = getProcessColor(p.id);
    const div = document.createElement('div');
    div.className = 'process-item animate-fade-in';
    div.innerHTML = `
      <div class="process-info">
        <span class="process-color-badge" style="background-color: ${color};"></span>
        <span class="process-id-name">${p.id}</span>
        <div class="process-details-badges">
          <span class="detail-badge at-badge">AT: ${p.arrivalTime}</span>
          <span class="detail-badge bt-badge">BT: ${p.burstTime}</span>
          <span class="detail-badge priority-badge">PR: ${p.priority}</span>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger" onclick="deleteProcess('${p.id}')" style="padding: 0.2rem 0.5rem;">✕</button>
    `;
    container.appendChild(div);
  });
}

// Hide elements when empty
function hideResults() {
  document.getElementById('visualizer-panel').style.display = 'none';
  document.getElementById('results-panel').style.display = 'none';
  document.getElementById('comparison-panel').style.display = 'none';
}

// Run scheduling and refresh views
async function runScheduler() {
  if (processes.length === 0) {
    hideResults();
    return;
  }

  const algo = document.getElementById('algorithm-select').value;
  const preemptive = document.getElementById('preemptive-toggle').checked;
  const highValueHighestPriority = document.getElementById('priority-order-toggle').checked;
  const timeQuantum = parseInt(document.getElementById('quantum-range').value) || 2;

  let result;
  
  if (backendOnline) {
    try {
      let endpoint = `${BACKEND_URL}/api/schedule/${algo}`;
      const payload = {
        processes,
        options: {
          preemptive,
          highValueHighestPriority,
          timeQuantum
        }
      };
      
      const res = await axios.post(endpoint, payload);
      result = res.data;
    } catch (e) {
      console.warn('API call failed, falling back to local scheduling engines.', e);
      result = runLocalScheduler(algo, preemptive, highValueHighestPriority, timeQuantum);
    }
  } else {
    result = runLocalScheduler(algo, preemptive, highValueHighestPriority, timeQuantum);
  }

  renderGanttChart(result.gantt);
  renderResultsTable(result.processes);
  renderSummaryMetrics(result.averages);
  
  // Show UI panels
  document.getElementById('visualizer-panel').style.display = 'block';
  document.getElementById('results-panel').style.display = 'block';
  
  // Also run comparison simulation
  runAllComparisons();
}

// Render Gantt chart visualization
function renderGanttChart(gantt) {
  const chart = document.getElementById('gantt-chart');
  chart.innerHTML = '';

  if (!gantt || gantt.length === 0) return;

  const totalDuration = gantt[gantt.length - 1].end;

  gantt.forEach(block => {
    const duration = block.end - block.start;
    // Calculate width percentage relative to total duration
    const widthPercent = (duration / totalDuration) * 100;
    
    const div = document.createElement('div');
    div.className = `gantt-block ${block.pid === 'Idle' ? 'idle' : ''}`;
    div.style.width = `${widthPercent}%`;
    div.style.backgroundColor = getProcessColor(block.pid);
    
    // Label display
    div.innerHTML = `
      <span>${block.pid}</span>
      <span class="gantt-time gantt-start-time">${block.start}</span>
      <span class="gantt-time gantt-end-time">${block.end}</span>
    `;
    chart.appendChild(div);
  });

  // Display axis labels
  const axis = document.getElementById('gantt-axis');
  axis.innerHTML = `<span>Time: 0</span><span>Duration: ${totalDuration} ms</span>`;
}

// Render processes table
function renderResultsTable(procs) {
  const tbody = document.getElementById('results-table-body');
  tbody.innerHTML = '';

  procs.forEach(p => {
    const color = getProcessColor(p.id);
    const tr = document.createElement('tr');
    tr.className = 'animate-fade-in';
    tr.innerHTML = `
      <td>
        <span class="row-color-indicator" style="background-color: ${color}"></span>
        <strong>${p.id}</strong>
      </td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td>${p.priority}</td>
      <td>${p.completionTime}</td>
      <td>${p.turnaroundTime}</td>
      <td>${p.waitingTime}</td>
      <td>${p.responseTime}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Update the summary metrics cards
function renderSummaryMetrics(averages) {
  document.getElementById('avg-waiting').textContent = averages.avgWaitingTime;
  document.getElementById('avg-turnaround').textContent = averages.avgTurnaroundTime;
  document.getElementById('cpu-util').textContent = averages.cpuUtilization;
}

// Run comparison of ALL scheduling algorithms
function runAllComparisons() {
  const algosToRun = [
    { name: 'FCFS', key: 'fcfs', options: {} },
    { name: 'SJF (Non-Preemptive)', key: 'sjf', options: { preemptive: false } },
    { name: 'SRTF (Preemptive SJF)', key: 'sjf', options: { preemptive: true } },
    { name: 'Priority (Non-Preemptive)', key: 'priority', options: { preemptive: false, highValueHighestPriority: false } },
    { name: 'Priority (Preemptive)', key: 'priority', options: { preemptive: true, highValueHighestPriority: false } },
    { name: 'Round Robin (Q=2)', key: 'rr', options: { timeQuantum: 2 } },
    { name: 'Round Robin (Q=4)', key: 'rr', options: { timeQuantum: 4 } }
  ];

  const results = algosToRun.map(item => {
    const schedResult = runLocalScheduler(item.key, item.options.preemptive, item.options.highValueHighestPriority, item.options.timeQuantum || 2);
    return {
      name: item.name,
      avgWaitingTime: schedResult.averages.avgWaitingTime,
      avgTurnaroundTime: schedResult.averages.avgTurnaroundTime,
      cpuUtilization: schedResult.averages.cpuUtilization
    };
  });

  // Sort by lowest average waiting time
  results.sort((a, b) => a.avgWaitingTime - b.avgWaitingTime);

  const container = document.getElementById('comparison-grid');
  container.innerHTML = '';

  results.forEach((res, index) => {
    let rankClass = '';
    let rankText = `#${index + 1}`;
    
    if (index === 0) rankClass = 'rank-1';
    if (index === results.length - 1) rankClass = 'rank-last';

    const card = document.createElement('div');
    card.className = 'comparison-card animate-fade-in';
    card.innerHTML = `
      <div class="comparison-card-header">
        <span class="comparison-card-title">${res.name}</span>
        <span class="comparison-rank ${rankClass}">${rankText}</span>
      </div>
      <div class="comparison-metrics-list">
        <div class="comparison-metric-item">
          <span class="comparison-metric-lbl">Avg Waiting:</span>
          <span class="comparison-metric-val" style="color: ${index === 0 ? 'var(--color-success)' : 'var(--text-primary)'}">${res.avgWaitingTime} ms</span>
        </div>
        <div class="comparison-metric-item">
          <span class="comparison-metric-lbl">Avg Turnaround:</span>
          <span class="comparison-metric-val">${res.avgTurnaroundTime} ms</span>
        </div>
        <div class="comparison-metric-item">
          <span class="comparison-metric-lbl">CPU Util:</span>
          <span class="comparison-metric-val">${res.cpuUtilization}%</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('comparison-panel').style.display = 'block';
}


/* ==========================================================================
   LOCAL CLIENT SCHEDULING ENGINES (Mirroring backend functionality for offline)
   ========================================================================== */

function calculateLocalAverages(processes, gantt) {
  const n = processes.length;
  if (n === 0) return { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 };

  let totalWaitingTime = 0;
  let totalTurnaroundTime = 0;

  processes.forEach(p => {
    totalWaitingTime += p.waitingTime;
    totalTurnaroundTime += p.turnaroundTime;
  });

  const totalDuration = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  let busyDuration = 0;
  gantt.forEach(block => {
    if (block.pid !== 'Idle') {
      busyDuration += (block.end - block.start);
    }
  });

  const cpuUtilization = totalDuration > 0 ? (busyDuration / totalDuration) * 100 : 0;

  return {
    avgWaitingTime: Number((totalWaitingTime / n).toFixed(2)),
    avgTurnaroundTime: Number((totalTurnaroundTime / n).toFixed(2)),
    cpuUtilization: Number(cpuUtilization.toFixed(2))
  };
}

function runLocalScheduler(algo, preemptive, highValueHighestPriority, timeQuantum) {
  switch (algo) {
    case 'fcfs':
      return runLocalFCFS();
    case 'sjf':
      return runLocalSJF(preemptive);
    case 'priority':
      return runLocalPriority(preemptive, highValueHighestPriority);
    case 'rr':
      return runLocalRoundRobin(timeQuantum);
    default:
      return runLocalFCFS();
  }
}

function runLocalFCFS() {
  const list = processes.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    priority: Number(p.priority)
  })).sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return String(a.id).localeCompare(String(b.id));
  });

  let currentTime = 0;
  const gantt = [];
  const results = [];

  list.forEach(p => {
    if (currentTime < p.arrivalTime) {
      gantt.push({ pid: 'Idle', start: currentTime, end: p.arrivalTime });
      currentTime = p.arrivalTime;
    }

    const start = currentTime;
    const end = currentTime + p.burstTime;
    gantt.push({ pid: p.id, start, end });

    results.push({
      ...p,
      completionTime: end,
      turnaroundTime: end - p.arrivalTime,
      waitingTime: (end - p.arrivalTime) - p.burstTime,
      responseTime: start - p.arrivalTime
    });

    currentTime = end;
  });

  return {
    gantt,
    processes: results,
    averages: calculateLocalAverages(results, gantt)
  };
}

function runLocalSJF(preemptive) {
  const list = processes.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: Number(p.priority)
  }));

  const n = list.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  if (!preemptive) {
    const completed = new Set();
    while (completedCount < n) {
      const available = list.filter(p => p.arrivalTime <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        const nextArrivals = list.filter(p => !completed.has(p.id)).map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);
        gantt.push({ pid: 'Idle', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }

      available.sort((a, b) => {
        if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return String(a.id).localeCompare(String(b.id));
      });

      const selected = available[0];
      const start = currentTime;
      const end = currentTime + selected.burstTime;

      gantt.push({ pid: selected.id, start, end });
      completed.add(selected.id);
      completedCount++;

      results.push({
        ...selected,
        completionTime: end,
        turnaroundTime: end - selected.arrivalTime,
        waitingTime: (end - selected.arrivalTime) - selected.burstTime,
        responseTime: start - selected.arrivalTime
      });

      currentTime = end;
    }
  } else {
    // Preemptive SJF
    let lastPid = null;
    let lastStart = 0;

    while (completedCount < n) {
      const available = list.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

      if (available.length === 0) {
        const nextArrivals = list.filter(p => p.remainingTime > 0).map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);

        if (lastPid !== 'Idle' && lastPid !== null) {
          gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
        }
        if (lastPid !== 'Idle') {
          lastPid = 'Idle';
          lastStart = currentTime;
        }
        currentTime = nextArrival;
        continue;
      }

      available.sort((a, b) => {
        if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return String(a.id).localeCompare(String(b.id));
      });

      const selected = available[0];

      if (lastPid !== selected.id) {
        if (lastPid !== null) {
          gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
        }
        lastPid = selected.id;
        lastStart = currentTime;
      }

      if (selected.firstStartTime === -1) {
        selected.firstStartTime = currentTime;
      }

      selected.remainingTime -= 1;
      currentTime += 1;

      if (selected.remainingTime === 0) {
        gantt.push({ pid: selected.id, start: lastStart, end: currentTime });
        lastPid = null;

        results.push({
          ...selected,
          completionTime: currentTime,
          turnaroundTime: currentTime - selected.arrivalTime,
          waitingTime: (currentTime - selected.arrivalTime) - selected.burstTime,
          responseTime: selected.firstStartTime - selected.arrivalTime
        });
        completedCount++;
      }
    }
    if (lastPid !== null) {
      gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
    }
  }

  // Merge Gantt blocks
  const mergedGantt = [];
  gantt.forEach(block => {
    if (block.start === block.end) return;
    if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].pid === block.pid) {
      mergedGantt[mergedGantt.length - 1].end = block.end;
    } else {
      mergedGantt.push({ ...block });
    }
  });

  return {
    gantt: mergedGantt,
    processes: results.sort((a, b) => String(a.id).localeCompare(String(b.id))),
    averages: calculateLocalAverages(results, mergedGantt)
  };
}

function runLocalPriority(preemptive, highValueHighestPriority) {
  const list = processes.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: Number(p.priority)
  }));

  const n = list.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  const comparePriority = (a, b) => {
    if (a.priority !== b.priority) {
      return highValueHighestPriority ? b.priority - a.priority : a.priority - b.priority;
    }
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return String(a.id).localeCompare(String(b.id));
  };

  if (!preemptive) {
    const completed = new Set();
    while (completedCount < n) {
      const available = list.filter(p => p.arrivalTime <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        const nextArrivals = list.filter(p => !completed.has(p.id)).map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);
        gantt.push({ pid: 'Idle', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }

      available.sort(comparePriority);

      const selected = available[0];
      const start = currentTime;
      const end = currentTime + selected.burstTime;

      gantt.push({ pid: selected.id, start, end });
      completed.add(selected.id);
      completedCount++;

      results.push({
        ...selected,
        completionTime: end,
        turnaroundTime: end - selected.arrivalTime,
        waitingTime: (end - selected.arrivalTime) - selected.burstTime,
        responseTime: start - selected.arrivalTime
      });

      currentTime = end;
    }
  } else {
    // Preemptive Priority
    let lastPid = null;
    let lastStart = 0;

    while (completedCount < n) {
      const available = list.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

      if (available.length === 0) {
        const nextArrivals = list.filter(p => p.remainingTime > 0).map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);

        if (lastPid !== 'Idle' && lastPid !== null) {
          gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
        }
        if (lastPid !== 'Idle') {
          lastPid = 'Idle';
          lastStart = currentTime;
        }
        currentTime = nextArrival;
        continue;
      }

      available.sort(comparePriority);

      const selected = available[0];

      if (lastPid !== selected.id) {
        if (lastPid !== null) {
          gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
        }
        lastPid = selected.id;
        lastStart = currentTime;
      }

      if (selected.firstStartTime === -1) {
        selected.firstStartTime = currentTime;
      }

      selected.remainingTime -= 1;
      currentTime += 1;

      if (selected.remainingTime === 0) {
        gantt.push({ pid: selected.id, start: lastStart, end: currentTime });
        lastPid = null;

        results.push({
          ...selected,
          completionTime: currentTime,
          turnaroundTime: currentTime - selected.arrivalTime,
          waitingTime: (currentTime - selected.arrivalTime) - selected.burstTime,
          responseTime: selected.firstStartTime - selected.arrivalTime
        });
        completedCount++;
      }
    }
    if (lastPid !== null) {
      gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
    }
  }

  // Merge Gantt blocks
  const mergedGantt = [];
  gantt.forEach(block => {
    if (block.start === block.end) return;
    if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].pid === block.pid) {
      mergedGantt[mergedGantt.length - 1].end = block.end;
    } else {
      mergedGantt.push({ ...block });
    }
  });

  return {
    gantt: mergedGantt,
    processes: results.sort((a, b) => String(a.id).localeCompare(String(b.id))),
    averages: calculateLocalAverages(results, mergedGantt)
  };
}

function runLocalRoundRobin(timeQuantum) {
  const list = processes.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: Number(p.priority)
  }));

  const n = list.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  const queue = [];
  const inQueue = new Set();
  const queuedAtSomePoint = new Set();

  const enqueueNewArrivals = () => {
    const arrivals = list.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0 && !inQueue.has(p.id) && !queuedAtSomePoint.has(p.id));
    arrivals.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return String(a.id).localeCompare(String(b.id));
    });

    arrivals.forEach(p => {
      queue.push(p);
      inQueue.add(p.id);
      queuedAtSomePoint.add(p.id);
    });
  };

  enqueueNewArrivals();

  while (completedCount < n) {
    if (queue.length === 0) {
      const incomplete = list.filter(p => p.remainingTime > 0);
      if (incomplete.length === 0) break;

      const nextArrival = Math.min(...incomplete.map(p => p.arrivalTime));
      gantt.push({ pid: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      enqueueNewArrivals();
      continue;
    }

    const current = queue.shift();
    inQueue.delete(current.id);

    if (current.firstStartTime === -1) {
      current.firstStartTime = currentTime;
    }

    const runDuration = Math.min(current.remainingTime, timeQuantum);
    const start = currentTime;
    const end = currentTime + runDuration;

    gantt.push({ pid: current.id, start, end });

    currentTime = end;
    current.remainingTime -= runDuration;

    enqueueNewArrivals();

    if (current.remainingTime > 0) {
      queue.push(current);
      inQueue.add(current.id);
    } else {
      results.push({
        ...current,
        completionTime: currentTime,
        turnaroundTime: currentTime - current.arrivalTime,
        waitingTime: (currentTime - current.arrivalTime) - current.burstTime,
        responseTime: current.firstStartTime - current.arrivalTime
      });
      completedCount++;
    }
  }

  // Merge Gantt blocks
  const mergedGantt = [];
  gantt.forEach(block => {
    if (block.start === block.end) return;
    if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].pid === block.pid) {
      mergedGantt[mergedGantt.length - 1].end = block.end;
    } else {
      mergedGantt.push({ ...block });
    }
  });

  return {
    gantt: mergedGantt,
    processes: results.sort((a, b) => String(a.id).localeCompare(String(b.id))),
    averages: calculateLocalAverages(results, mergedGantt)
  };
}
