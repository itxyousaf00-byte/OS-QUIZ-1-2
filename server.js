const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to calculate average metrics
function calculateAverages(processes, gantt) {
  const n = processes.length;
  if (n === 0) return { avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0 };

  let totalWaitingTime = 0;
  let totalTurnaroundTime = 0;

  processes.forEach(p => {
    totalWaitingTime += p.waitingTime;
    totalTurnaroundTime += p.turnaroundTime;
  });

  // Calculate CPU Utilization
  // Total time is the end of the last Gantt block
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

// 1. FCFS Scheduling
function runFCFS(processesList) {
  // Deep copy and sort by arrival time, then ID
  const processes = processesList.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    priority: p.priority !== undefined ? Number(p.priority) : 0,
  })).sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return String(a.id).localeCompare(String(b.id));
  });

  let currentTime = 0;
  const gantt = [];
  const results = [];

  processes.forEach(p => {
    if (currentTime < p.arrivalTime) {
      gantt.push({ pid: 'Idle', start: currentTime, end: p.arrivalTime });
      currentTime = p.arrivalTime;
    }

    const start = currentTime;
    const end = currentTime + p.burstTime;
    gantt.push({ pid: p.id, start, end });

    const completionTime = end;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = start - p.arrivalTime;

    results.push({
      ...p,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    });

    currentTime = end;
  });

  return {
    gantt,
    processes: results,
    averages: calculateAverages(results, gantt)
  };
}

// 2. SJF (Shortest Job First) - Preemptive and Non-Preemptive
function runSJF(processesList, preemptive = false) {
  const processes = processesList.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: p.priority !== undefined ? Number(p.priority) : 0,
  }));

  const n = processes.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  if (!preemptive) {
    const completed = new Set();
    while (completedCount < n) {
      // Find arrived and uncompleted processes
      const available = processes.filter(p => p.arrivalTime <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        // Find next arrival
        const nextArrivals = processes
          .filter(p => !completed.has(p.id))
          .map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);

        gantt.push({ pid: 'Idle', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        continue;
      }

      // Sort by burst time, then arrival time, then ID
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

      const completionTime = end;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      const responseTime = start - selected.arrivalTime;

      results.push({
        id: selected.id,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });

      currentTime = end;
    }
  } else {
    // Preemptive SJF (SRTF)
    let lastPid = null;
    let lastStart = 0;

    while (completedCount < n) {
      const available = processes.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

      if (available.length === 0) {
        // Jump to next arrival time
        const nextArrivals = processes
          .filter(p => p.remainingTime > 0)
          .map(p => p.arrivalTime);
        const nextArrival = Math.min(...nextArrivals);

        if (lastPid !== 'Idle' && lastPid !== null) {
          gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
        }
        if (lastPid === 'Idle') {
          // extend idle
        } else {
          lastPid = 'Idle';
          lastStart = currentTime;
        }

        currentTime = nextArrival;
        continue;
      }

      // Select process with shortest remaining time
      available.sort((a, b) => {
        if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return String(a.id).localeCompare(String(b.id));
      });

      const selected = available[0];

      // Update Gantt if process switched
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

      // Run for 1 step (to handle next arrival check)
      selected.remainingTime -= 1;
      currentTime += 1;

      if (selected.remainingTime === 0) {
        // Process finished
        gantt.push({ pid: selected.id, start: lastStart, end: currentTime });
        lastPid = null; // force new block next time

        const completionTime = currentTime;
        const turnaroundTime = completionTime - selected.arrivalTime;
        const waitingTime = turnaroundTime - selected.burstTime;
        const responseTime = selected.firstStartTime - selected.arrivalTime;

        results.push({
          id: selected.id,
          arrivalTime: selected.arrivalTime,
          burstTime: selected.burstTime,
          priority: selected.priority,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });

        completedCount++;
      }
    }

    if (lastPid !== null) {
      gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
    }
  }

  // Merge contiguous gantt intervals for the same pid
  const mergedGantt = [];
  gantt.forEach(block => {
    if (block.start === block.end) return; // skip empty blocks
    if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].pid === block.pid) {
      mergedGantt[mergedGantt.length - 1].end = block.end;
    } else {
      mergedGantt.push({ ...block });
    }
  });

  return {
    gantt: mergedGantt,
    processes: results.sort((a, b) => String(a.id).localeCompare(String(b.id))),
    averages: calculateAverages(results, mergedGantt)
  };
}

// 3. Priority Scheduling
function runPriority(processesList, preemptive = false, highValueHighestPriority = false) {
  const processes = processesList.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: p.priority !== undefined ? Number(p.priority) : 0,
  }));

  const n = processes.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  // Helper to compare priority
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
      const available = processes.filter(p => p.arrivalTime <= currentTime && !completed.has(p.id));

      if (available.length === 0) {
        const nextArrivals = processes
          .filter(p => !completed.has(p.id))
          .map(p => p.arrivalTime);
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

      const completionTime = end;
      const turnaroundTime = completionTime - selected.arrivalTime;
      const waitingTime = turnaroundTime - selected.burstTime;
      const responseTime = start - selected.arrivalTime;

      results.push({
        id: selected.id,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        priority: selected.priority,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });

      currentTime = end;
    }
  } else {
    // Preemptive Priority
    let lastPid = null;
    let lastStart = 0;

    while (completedCount < n) {
      const available = processes.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

      if (available.length === 0) {
        const nextArrivals = processes
          .filter(p => p.remainingTime > 0)
          .map(p => p.arrivalTime);
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

        const completionTime = currentTime;
        const turnaroundTime = completionTime - selected.arrivalTime;
        const waitingTime = turnaroundTime - selected.burstTime;
        const responseTime = selected.firstStartTime - selected.arrivalTime;

        results.push({
          id: selected.id,
          arrivalTime: selected.arrivalTime,
          burstTime: selected.burstTime,
          priority: selected.priority,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });

        completedCount++;
      }
    }

    if (lastPid !== null) {
      gantt.push({ pid: lastPid, start: lastStart, end: currentTime });
    }
  }

  // Merge contiguous blocks
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
    averages: calculateAverages(results, mergedGantt)
  };
}

// 4. Round Robin Scheduling
function runRoundRobin(processesList, timeQuantum = 2) {
  const processes = processesList.map(p => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    remainingTime: Number(p.burstTime),
    firstStartTime: -1,
    priority: p.priority !== undefined ? Number(p.priority) : 0,
  }));

  const n = processes.length;
  let currentTime = 0;
  let completedCount = 0;
  const gantt = [];
  const results = [];

  // Sort processes originally by arrival time and ID
  const queue = [];
  const inQueue = new Set();
  const queuedAtSomePoint = new Set();

  // Helper to add arrived processes to the queue
  const enqueueNewArrivals = () => {
    const arrivals = processes.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0 && !inQueue.has(p.id) && !queuedAtSomePoint.has(p.id));
    // Sort arrivals by arrival time, then ID
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

  // Initial enqueue
  enqueueNewArrivals();

  while (completedCount < n) {
    if (queue.length === 0) {
      // Find the next arrival of any incomplete process
      const incomplete = processes.filter(p => p.remainingTime > 0);
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

    // Move time forward and enqueue new arrivals in that gap
    currentTime = end;
    current.remainingTime -= runDuration;

    // First check for arrivals in the interval (start, end]
    // But since time is now 'end', we can simply call our helper which checks up to 'currentTime'
    enqueueNewArrivals();

    if (current.remainingTime > 0) {
      queue.push(current);
      inQueue.add(current.id);
    } else {
      const completionTime = currentTime;
      const turnaroundTime = completionTime - current.arrivalTime;
      const waitingTime = turnaroundTime - current.burstTime;
      const responseTime = current.firstStartTime - current.arrivalTime;

      results.push({
        id: current.id,
        arrivalTime: current.arrivalTime,
        burstTime: current.burstTime,
        priority: current.priority,
        completionTime,
        turnaroundTime,
        waitingTime,
        responseTime
      });

      completedCount++;
    }
  }

  // Merge contiguous Gantt blocks
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
    averages: calculateAverages(results, mergedGantt)
  };
}

// Router Endpoints
app.post('/api/schedule/fcfs', (req, res) => {
  try {
    const { processes } = req.body;
    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({ error: 'Invalid or missing processes array.' });
    }
    const result = runFCFS(processes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule/sjf', (req, res) => {
  try {
    const { processes, options } = req.body;
    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({ error: 'Invalid or missing processes array.' });
    }
    const preemptive = options ? !!options.preemptive : false;
    const result = runSJF(processes, preemptive);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule/priority', (req, res) => {
  try {
    const { processes, options } = req.body;
    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({ error: 'Invalid or missing processes array.' });
    }
    const preemptive = options ? !!options.preemptive : false;
    const highValueHighestPriority = options ? !!options.highValueHighestPriority : false;
    const result = runPriority(processes, preemptive, highValueHighestPriority);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule/rr', (req, res) => {
  try {
    const { processes, options } = req.body;
    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({ error: 'Invalid or missing processes array.' });
    }
    const timeQuantum = options && options.timeQuantum ? Number(options.timeQuantum) : 2;
    const result = runRoundRobin(processes, timeQuantum);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`CPU Scheduling Backend running at http://localhost:${PORT}`);
});
