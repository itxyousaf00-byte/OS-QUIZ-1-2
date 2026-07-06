# CPU Scheduling Algorithms Visualizer & Comparison Dashboard

This project is a high-performance, full-stack CPU scheduling simulation and comparison web application. It features a premium, responsive glassmorphic dark-theme user interface built with HTML5, CSS3, and JavaScript, paired with a robust Node.js/Express.js backend for scheduling computations.

---

## 🚀 Key Features

- **Multiple Core Algorithms Supported**:
  - **First Come First Serve (FCFS)**: Non-preemptive scheduling based purely on arrival time.
  - **Shortest Job First (SJF)**: Includes both **Non-Preemptive SJF** and **Preemptive Shortest Remaining Time First (SRTF)**.
  - **Priority Scheduling**: Support for **Non-Preemptive** and **Preemptive** priority execution, with customizable priority ranking direction (Low-Value-Highest or High-Value-Highest).
  - **Round Robin (RR)**: Time quantum sliced queue scheduling (fully customizable time quantum size).
- **Dynamic Gantt Chart Timeline**: Visualized block breakdown of CPU execution intervals, including CPU Idle blocks.
- **Detailed Calculations Table**: Interactive metrics per process displaying:
  - Arrival Time (AT)
  - Burst Time (BT)
  - Priority (PR)
  - Completion Time (CT)
  - Turnaround Time (TAT)
  - Waiting Time (WT)
  - Response Time (RT)
- **Averages & Efficiency Cards**: Calculates Average Waiting Time, Average Turnaround Time, and overall CPU Utilization percentage.
- **Side-by-Side Multi-Algorithm Comparison**: Simulates all algorithms simultaneously on your current dataset, sorting and ranking them to determine the most efficient choice (lowest average waiting time).
- **Offline / Standalone Fallback**: If the Node.js backend server is offline, the frontend falls back seamlessly to a local JavaScript scheduling engine.

---

## 🛠️ Project Structure

```
d:/OS quiz 1,2/
├── package.json         # Updated dependencies and run scripts
├── server.js            # Node/Express backend containing algorithm logic and API routes
├── index.html           # Main frontend interface shell
├── style.css            # Custom premium styles (glassmorphism, variables, animations)
├── frontend.js          # Interactive frontend logic, Gantt rendering, API requests
└── README.md            # Setup & running instructions
```

---

## ⚡ Setup & Execution Instructions

Follow these quick steps to get the application running on your system:

### 1. Install Dependencies
Ensure you have [Node.js](https://nodejs.org/) installed. Open your command terminal in the project workspace directory (`d:\OS quiz 1,2`) and run:
```bash
npm install
```

### 2. Start the Backend Server
Start the Express server on port 5000:
```bash
npm start
```
*Alternatively, you can run:*
```bash
npm run dev
```

You should see the message:
`CPU Scheduling Backend running at http://localhost:5000`

### 3. Open the Dashboard in your Browser
You can access the UI in two ways:
- **Through the Server**: Navigate to **[http://localhost:5000](http://localhost:5000)** in your browser.
- **Directly**: Double-click or open `index.html` directly in your browser of choice. It will run in **Offline Mode (Local JS Engine)** and still perform all computations and visualizations successfully!

---

## 🧠 Scheduling Algorithms Explained

### 1. First Come First Serve (FCFS)
- **Concept**: The process that requests the CPU first gets the CPU allocated first.
- **Characteristics**: Non-preemptive, simple to implement, but suffers from the **Convoy Effect** (short processes wait a long time for a single long process ahead of them).

### 2. Shortest Job First (SJF / SRTF)
- **Concept**: Associates with each process the length of its next CPU burst, allocating the CPU to the shortest job first.
- **Non-Preemptive**: Once CPU is allocated, it cannot be preempted until completion.
- **Preemptive (SRTF)**: If a new process arrives with a remaining CPU burst time shorter than the currently running process, the current process is preempted.

### 3. Priority Scheduling
- **Concept**: The CPU is allocated to the process with the highest priority.
- **Toggles**:
  - **Preemptive**: Preempts the CPU if a newly arrived process has a higher priority.
  - **Priority Order**: Can be configured so that either low integer values represent higher priority (UNIX-like) or high integer values represent higher priority.

### 4. Round Robin (RR)
- **Concept**: Designed specifically for timesharing systems. A small unit of time, called a **Time Quantum**, is defined. The CPU scheduler goes around the ready queue, allocating the CPU to each process for a time interval of up to 1 time quantum.
- **Characteristics**: Preemptive by design. Outstanding performance for response times.
