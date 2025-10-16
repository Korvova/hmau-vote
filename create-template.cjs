#!/usr/bin/env node
// Create voting template with CanCorrect=true

const io = require('socket.io-client');
const crypto = require('crypto');

const SOCKET_URL = 'https://rms-bot.com/cocon-connector';

async function createTemplate() {
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
    }, 30000);

    socket.on('connect', () => {
      console.log(`[CreateTemplate] Connected, sending command...`);
      socket.emit('server:command:exec', {
        id: commandId,
        type: 'CreateVotingTemplate',
        payload: {
          title: '3_Vote_Correctable',
          voteType: 'OPEN',
          duration: 180,
          canCorrect: true
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
  try {
    console.log('[CreateTemplate] Creating voting template with CanCorrect=true...');
    const result = await createTemplate();
    console.log('[CreateTemplate] ✓ Template created successfully:', result);
    console.log('\nНовый шаблон "3_Vote_Correctable" создан!');
    console.log('Теперь можно запускать голосование - оно будет использовать этот шаблон.');
    process.exit(0);
  } catch (e) {
    console.error('[CreateTemplate] ✗ Error:', e.message);
    process.exit(1);
  }
}

main();
