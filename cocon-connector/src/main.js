const { app, BrowserWindow } = require('electron');
const path = require('path');
const Store = require('electron-store');

// App config store with defaults
const store = new Store({
  name: 'cocon-connector-config',
  defaults: {
    listener: { host: '0.0.0.0', port: 4000 },
    site: {
      baseUrl: 'https://rms-bot.com',
      apiBase: 'https://rms-bot.com/api',
      socketUrl: 'https://rms-bot.com',
      namespace: '/cocon-connector',
      topic: 'default-topic'
    },
    cocon: {
      roomName: 'Test',
      roomId: 1,
      serverVersion: '6.9.5.2',
      protocolVersion: '0.01',
      roomServerIp: '10.0.20.94',
      roomServerSecondaryIp: '192.168.56.1',
      mmeIp: '10.0.20.32',
      mmePort: 80,
      mmeApiPort: 9012,
      coConBase: 'http://localhost:8890/CoCon',
      legacyApiBase: 'http://localhost:58521' // optional: existing .NET Out-app-cocon
    },
    security: { token: '' },
    connector: { connectorId: '' }
  }
});

// Start embedded HTTP server
function startBackend() {
  const { startServer } = require('./backend/server');
  const cfg = store.store;
  return startServer({ store, config: cfg });
}

async function startSocket() {
  const { startSocketBridge } = require('./backend/socketClient');
  await startSocketBridge({ store });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  await startBackend();
  await startSocket();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
