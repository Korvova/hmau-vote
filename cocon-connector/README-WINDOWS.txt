=========================================
  CoCon Connector - Windows Setup
=========================================

WHAT IS THIS:
Desktop application that connects Televic CoCon conference system
with your voting web application (rms-bot.com/vote).

SYSTEM REQUIREMENTS:
- Windows 10/11
- Node.js 18 or higher (https://nodejs.org/)
- Network access to CoCon hardware

INSTALLATION (Windows):

1. Extract this archive to C:\cocon-connector\

2. Install Node.js from: https://nodejs.org/
   (Choose LTS version)

3. Open PowerShell in project folder and run:
   npm install

4. Start the application:
   npm start
   
   OR for production:
   npm run dev

CONFIGURATION:
After starting, configure in the Electron window:
- Socket base URL: https://rms-bot.com
- Namespace: /cocon-connector
- Topic: your venue key (e.g., gost-duma-2025)
- Room ID: CoCon room number
- Local listener port: 4000 (default)

BUILDING WINDOWS INSTALLER:
To create a standalone .exe installer:
   npm run build:win

This will create an installer in dist/ folder.

AUTO-START WITH PM2 (recommended):
1. Install PM2 globally:
   npm install -g pm2

2. Start with PM2:
   pm2 start npm --name cocon -- start

3. Save to start on boot:
   pm2 save
   pm2 startup

PORTS:
- Local API: 4000 (configurable in Settings)
- Electron UI: runs locally

TROUBLESHOOTING:
Q: "Node.js not found"?
A: Install Node.js and restart PowerShell

Q: "npm install" fails?
A: Run PowerShell as Administrator

Q: Can't connect to CoCon?
A: Check network connectivity and CoCon IP address

For support, contact the developer.
