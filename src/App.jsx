import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import imageCompression from 'browser-image-compression';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Connect to the Socket.IO server
const socket = io('http://localhost:4002'); // Replace with your server's URL

const App = () => {
  const [images, setImages] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [finalWinner, setFinalWinner] = useState(null);
  const [userImage, setUserImage] = useState(null); // User's uploaded image
  const [uploading, setUploading] = useState(false);

  // Load images from localStorage
  useEffect(() => {
    const storedImages = JSON.parse(localStorage.getItem('images')) || [];
    setImages(storedImages);
  }, []);

  // Update localStorage whenever images change
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem('images', JSON.stringify(images));
    }
  }, [images]);

  // Socket.IO listeners
  useEffect(() => {
    // Receive initial data from the server
    socket.on('initial_data', ({ images, currentPair, finalWinner }) => {
      setImages(images);
      setCurrentPair(currentPair);
      setFinalWinner(finalWinner);
    });

    // Receive updates from the server
    socket.on('update_data', ({ images, currentPair, finalWinner }) => {
      setImages(images);
      setCurrentPair(currentPair);
      setFinalWinner(finalWinner);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle image upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        setUploading(true);
        const compressedFile = await imageCompression(file, options);

        const reader = new FileReader();
        reader.onload = () => {
          const newImage = { id: Date.now(), src: reader.result, wins: 0, losses: 0 };
          const updatedImages = [...images, newImage];
          setImages(updatedImages);
          setUserImage(newImage); // Set the user's uploaded image
          socket.emit('upload_image', newImage); // Notify server
          setUploading(false);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error uploading image:', error);
        setUploading(false);
      }
    }
  };

  // Start voting
  const startVoting = () => {
    if (images.length === 4) {
      const initialQueue = [...images];
      const [first, second, ...rest] = initialQueue;
      setQueue(rest);
      setCurrentPair([first, second]);
    }
  };

  // Handle voting
  const handleVote = (selectedId) => {
    const winner = currentPair.find((img) => img.id === selectedId);
    const loser = currentPair.find((img) => img.id !== selectedId);

    // Update wins and losses
    winner.wins += 1;
    loser.losses += 1;

    // Update queue and next comparison
    let nextQueue = [...queue];

    if (queue.length > 0) {
      const nextImage = nextQueue.shift();
      setCurrentPair([winner, nextImage]);
      setQueue(nextQueue);
    } else {
      // Check for ties or determine the winner
      const maxWins = Math.max(...images.map((img) => img.wins));
      const potentialWinners = images.filter((img) => img.wins === maxWins);

      if (potentialWinners.length > 1) {
        setQueue(potentialWinners);
        setCurrentPair([potentialWinners[0], potentialWinners[1]]);
      } else {
        setFinalWinner(potentialWinners[0]);
        setCurrentPair([]);
      }
    }
  };

  // Automatically start voting when 4 images are uploaded
  useEffect(() => {
    if (images.length >= 4) {
      startVoting();
    }
  }, [images]);

  // Reset the app
  const resetApp = () => {
    localStorage.removeItem('images');
    setImages([]);
    setQueue([]);
    setCurrentPair([]);
    setFinalWinner(null);
    setUserImage(null);
  };

  return (
    <div className="container mt-6">
      <h1 className="text-center mb-4">MoonMash</h1>

      {/* Upload Section */}
      {!finalWinner && !userImage && images.length < 4 && (
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card shadow-sm p-4 rounded">
              <h3 className="mb-3">Upload Your Image</h3>
              <label className="btn btn-primary btn-lg">
                <i className="bi bi-upload"></i> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {uploading && (
                <div className="spinner-border text-primary mt-3" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voting Section */}
      {!finalWinner && currentPair.length === 2 && (
        <div className="text-center mt-4">
          <h3>Vote for the Best Image!</h3>
          <div className="row justify-content-center">
            {currentPair.map((img) => (
              <div key={img.id} className="col-md-4 text-center" onClick={() => handleVote(img.id)}>
                <img
                  src={img.src}
                  alt="Image for voting"
                  className="img-fluid rounded-circle mb-3"
                  style={{ width: '200px', height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winner Section */}
      {finalWinner && (
        <div className="text-center mt-4">
          <h3>Final Winner!</h3>
          <img
            src={finalWinner.src}
            alt="Winner"
            className="img-fluid rounded-circle"
            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
          />
          <button className="btn btn-danger mt-3" onClick={resetApp}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
