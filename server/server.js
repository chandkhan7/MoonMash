const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your React app's URL
    methods: ['GET', 'POST'],
  },
});

let images = []; // Shared image data
let currentPair = []; // Current pair of images for voting
let queue = []; // Remaining images in the queue
let finalWinner = null;

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send current data to the newly connected client
  socket.emit('initial_data', { images, currentPair, finalWinner });

  // Handle image upload
  socket.on('upload_image', (image) => {
    images.push(image);

    if (images.length === 4) {
      queue = [...images];
      const [first, second, ...rest] = queue;
      currentPair = [first, second];
      queue = rest;
    }

    io.emit('update_data', { images, currentPair, finalWinner });
  });

  // Handle voting
  socket.on('vote', (winnerId) => {
    const winner = currentPair.find((img) => img.id === winnerId);
    const loser = currentPair.find((img) => img.id !== winnerId);

    winner.wins++;
    loser.losses++;

    if (queue.length > 0) {
      const nextImage = queue.shift();
      currentPair = [winner, nextImage];
    } else {
      const maxWins = Math.max(...images.map((img) => img.wins));
      const potentialWinners = images.filter((img) => img.wins === maxWins);

      if (potentialWinners.length === 1) {
        finalWinner = potentialWinners[0];
        currentPair = [];
      } else {
        queue = [...potentialWinners];
        currentPair = [queue[0], queue[1]];
        queue = queue.slice(2);
      }
    }

    io.emit('update_data', { images, currentPair, finalWinner });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(4002, () => {
  console.log('Server is running on http://localhost:4002');
});
