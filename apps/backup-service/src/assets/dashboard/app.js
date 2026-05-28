const PRESET_LABELS = {
  EVERY_6_HOURS: 'Every 6 hours',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
};

const state = {
  history: [],
  schedule: 'DAILY',
};

const elements = {
  lastBackupTime: document.getElementById('lastBackupTime'),
  lastBackupStatus: document.getElementById('lastBackupStatus'),
  currentPreset: document.getElementById('currentPreset'),
  recentCount: document.getElementById('recentCount'),
  historyBody: document.getElementById('historyBody'),
  actionMessage: document.getElementById('actionMessage'),
  refreshButton: document.getElementById('refreshButton'),
  saveScheduleButton: document.getElementById('saveScheduleButton'),
  openRestoreButton: document.getElementById('openRestoreButton'),
  restoreDialog: document.getElementById('restoreDialog'),
  restoreSelect: document.getElementById('restoreSelect'),
  restoreForm: document.getElementById('restoreForm'),
  cancelRestoreButton: document.getElementById('cancelRestoreButton'),
};

function formatTimestamp(value) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) {
    return '--';
  }

  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) {
    return '--';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function statusClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCESS') return 'success';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'IN_PROGRESS') return 'running';
  return '';
}

function setMessage(text, type = '') {
  elements.actionMessage.textContent = text;
  elements.actionMessage.className = `message ${type}`.trim();
}

function getSelectedPreset() {
  const selected = document.querySelector(
    'input[name="schedulePreset"]:checked'
  );
  return selected ? selected.value : 'DAILY';
}

function setSelectedPreset(preset) {
  const input = document.querySelector(
    `input[name="schedulePreset"][value="${preset}"]`
  );
  if (input) {
    input.checked = true;
  }
  elements.currentPreset.textContent = PRESET_LABELS[preset] || preset || '--';
}

function latestRecord() {
  return state.history[0] || null;
}

function updateStatusCards() {
  const record = latestRecord();
  elements.lastBackupTime.textContent = record
    ? formatTimestamp(record.startTime)
    : '--';
  elements.lastBackupStatus.textContent = record ? record.status : '--';
  elements.recentCount.textContent = String(state.history.length);
}

function renderRestoreOptions() {
  elements.restoreSelect.innerHTML = '';
  for (const record of state.history) {
    const option = document.createElement('option');
    option.value = JSON.stringify({
      service: record.service,
      backup_id: record.id,
    });
    option.textContent = `${record.service} | ${record.id}`;
    elements.restoreSelect.appendChild(option);
  }
}

function openRestoreDialog(record) {
  if (!state.history.length) {
    setMessage('No backup records available for restore.', 'error');
    return;
  }

  renderRestoreOptions();
  if (record) {
    const targetValue = JSON.stringify({
      service: record.service,
      backup_id: record.id,
    });
    elements.restoreSelect.value = targetValue;
  }
  elements.restoreDialog.showModal();
}

function renderHistory() {
  elements.historyBody.innerHTML = '';
  for (const record of state.history) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatTimestamp(record.startTime)}</td>
      <td>${record.service || '--'}</td>
      <td><span class="badge ${statusClass(record.status)}">${
      record.status || '--'
    }</span></td>
      <td>${formatSize(record.fileSizeBytes)}</td>
      <td>${formatDuration(record.durationSeconds)}</td>
      <td>${record.id}</td>
      <td><button class="secondary-button restore-button" type="button">Restore</button></td>
    `;
    row
      .querySelector('button')
      .addEventListener('click', () => openRestoreDialog(record));
    elements.historyBody.appendChild(row);
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(
      body?.message ||
        body?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return body;
}

async function loadSchedule() {
  const result = await requestJson('/api/schedule');
  state.schedule = result.preset || 'DAILY';
  setSelectedPreset(state.schedule);
}

async function loadHistory() {
  const history = await requestJson('/api/backups/history?limit=20');
  state.history = Array.isArray(history) ? history : [];
  renderHistory();
  renderRestoreOptions();
  updateStatusCards();
}

async function refreshDashboard() {
  try {
    setMessage('Refreshing dashboard...');
    await Promise.all([loadSchedule(), loadHistory()]);
    setMessage('Dashboard updated.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function saveSchedule() {
  try {
    const preset = getSelectedPreset();
    const result = await requestJson('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ preset }),
    });
    state.schedule = result.preset || preset;
    setSelectedPreset(state.schedule);
    setMessage(
      `Schedule saved: ${PRESET_LABELS[state.schedule] || state.schedule}.`,
      'success'
    );
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function triggerBackup(service) {
  try {
    setMessage(`Triggering ${service} backup...`);
    const result = await requestJson('/api/backups/trigger', {
      method: 'POST',
      body: JSON.stringify({ service }),
    });
    setMessage(
      `Backup completed for ${result.service} with status ${result.status}.`,
      'success'
    );
    await loadHistory();
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function restoreBackup() {
  try {
    const payload = JSON.parse(elements.restoreSelect.value);
    setMessage(`Restoring ${payload.service}...`);
    const result = await requestJson('/api/backups/restore', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setMessage(
      `Restore finished for ${result.service} with status ${result.status}.`,
      'success'
    );
    elements.restoreDialog.close();
    await loadHistory();
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener('click', refreshDashboard);
  elements.saveScheduleButton.addEventListener('click', saveSchedule);
  elements.openRestoreButton.addEventListener('click', () =>
    openRestoreDialog()
  );
  elements.cancelRestoreButton.addEventListener('click', () =>
    elements.restoreDialog.close()
  );
  elements.restoreForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void restoreBackup();
  });

  document.querySelectorAll('.service-button').forEach((button) => {
    button.addEventListener('click', () => {
      void triggerBackup(button.dataset.service);
    });
  });
}

bindEvents();
setInterval(() => {
  void refreshDashboard();
}, 30000);
void refreshDashboard();
