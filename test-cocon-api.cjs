#!/usr/bin/env node
// Test script to call CoCon API through connector

const io = require('socket.io-client');
const crypto = require('crypto');

const SOCKET_URL = 'https://rms-bot.com/cocon-connector';

async function callCoconAPI(path, query = {}) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    const commandId = crypto.randomUUID();
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.close();
        reject(new Error('Timeout waiting for response'));
      }
    }, 15000);

    socket.on('connect', () => {
      console.log(`[Test] Connected, sending command...`);
      socket.emit('server:command:exec', {
        id: commandId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: path,
          query: query,
        }
      });
    });

    socket.on('connector:command:result', (result) => {
      if (result.id === commandId && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        socket.close();

        if (result.ok) {
          resolve(result.data);
        } else {
          reject(new Error(result.error || 'Command failed'));
        }
      }
    });

    socket.on('connect_error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

async function main() {
  const command = process.argv[2];

  if (!command) {
    console.log('Usage:');
    console.log('  node test-cocon-api.js templates     - Get voting templates');
    console.log('  node test-cocon-api.js state         - Get voting state');
    console.log('  node test-cocon-api.js instant NAME  - Try AddInstantVote');
    console.log('  node test-cocon-api.js start         - Try Start voting');
    console.log('  node test-cocon-api.js restart       - Try Restart voting');
    process.exit(1);
  }

  try {
    console.log(`[Test] Executing command: ${command}`);

    let result;
    switch (command) {
      case 'templates':
        result = await callCoconAPI('/Meeting_Agenda/GetVotingAgendaTemplateList');
        console.log('\n=== Voting Templates ===');
        const templates = result.data?.GetVotingAgendaTemplateList?.AgendaItems || [];
        console.log(`Found ${templates.length} templates:`);
        templates.forEach(t => {
          console.log(`  - ${t.Title || t.Name} (ID: ${t.Id})`);
        });
        break;

      case 'state':
        result = await callCoconAPI('/Voting/GetVotingState');
        console.log('\n=== Voting State ===');
        console.log(JSON.stringify(result.data, null, 2));
        break;

      case 'instant':
        const templateName = process.argv[3];
        if (!templateName) {
          console.error('Error: Template name required');
          process.exit(1);
        }
        result = await callCoconAPI('/Voting/AddInstantVote', { VotingTemplate: templateName });
        console.log('\n=== AddInstantVote Result ===');
        console.log(JSON.stringify(result.data, null, 2));
        break;

      case 'start':
        result = await callCoconAPI('/Voting/SetVotingState', { State: 'Start' });
        console.log('\n=== Start Result ===');
        console.log(`Response: ${result.data}`);
        console.log(`Status: ${result.data === '0' ? 'SUCCESS' : 'FAILED'}`);
        break;

      case 'restart':
        result = await callCoconAPI('/Voting/SetVotingState', { State: 'Restart' });
        console.log('\n=== Restart Result ===');
        console.log(`Response: ${result.data}`);
        console.log(`Status: ${result.data === '0' ? 'SUCCESS' : 'FAILED'}`);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log('\n[Test] Success!');
    process.exit(0);

  } catch (e) {
    console.error('\n[Test] Error:', e.message);
    process.exit(1);
  }
}

main();
