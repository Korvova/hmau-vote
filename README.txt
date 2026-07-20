=========================================
  HMAU VOTE - READY TO RUN PACKAGE
=========================================

WHAT'S INCLUDED:
- Complete voting application (React + Node.js + PostgreSQL)
- Pre-built Docker image (no build required!)
- Auto-start scripts
- Database with sample data

SYSTEM REQUIREMENTS:
- Windows 10/11
- Docker Desktop installed and running
- 8 GB RAM minimum
- 2 GB free disk space

INSTALLATION (3 STEPS):
1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Extract this archive to any folder (e.g., C:\hmau-vote\)
3. Run START.bat

That's it! The application will:
- Automatically load Docker image (first run only, takes 2-3 minutes)
- Start all containers
- Import database with UTF-8 encoding
- Open browser automatically

AFTER INSTALLATION:
Application: http://localhost:8090/hmau-vote/
API: http://localhost:5001/api/health

TROUBLESHOOTING:
Q: "Docker not running" error?
A: Start Docker Desktop and wait until it's fully running, then run START.bat again

Q: "Port already in use" error?
A: Close apps using ports 5001, 5433, or 8090, then run START.bat again

Q: Russian characters show as "???"?
A: This should be fixed automatically. If not, run REIMPORT-DB.bat

USEFUL SCRIPTS:
- START.bat - Start the application (use this every time)
- REIMPORT-DB.bat - Reset database to original state
- FIX-ENCODING.bat - Fix Russian character encoding issues

TECHNICAL DETAILS:
- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Database: PostgreSQL 16
- Ports: 8090 (nginx), 5001 (API), 5433 (database)

For support, contact the developer.

Generated with Claude Code
