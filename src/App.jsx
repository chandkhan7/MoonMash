import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Custom CSS
import imageCompression from 'browser-image-compression'; // Import compression library

const App = () => {
  const [images, setImages] = useState([]); // Store images uploaded by users
  const [queue, setQueue] = useState([]);  // Queue for voting
  const [currentPair, setCurrentPair] = useState([]); // Current pair of images for voting
  const [finalWinner, setFinalWinner] = useState(null); // Image with most wins
  const [userImage, setUserImage] = useState(null); // User's uploaded image (not shown after upload)

  // Load images from localStorage (for all users to see the same list)
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

  // Handle image upload and compress the image
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    
    if (file) {
      try {
        const options = {
          maxSizeMB: 1, // Set the max size to 1MB (you can adjust this)
          maxWidthOrHeight: 800, // Max width or height (you can adjust this)
          useWebWorker: true, // Use web worker for faster compression
        };

        // Compress the image
        const compressedFile = await imageCompression(file, options);

        const reader = new FileReader();
        reader.onload = () => {
          const newImage = { id: Date.now(), src: reader.result, wins: 0, losses: 0 };
          const updatedImages = [...images, newImage];
          setImages(updatedImages);
          setUserImage(newImage); // Set the user's uploaded image to hide after uploading
        };
        
        // Read the compressed image as data URL
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error while compressing image:', error);
      }
    }
  };

  // Start voting once 4 images are uploaded
  const startVoting = () => {
    if (images.length === 4) {
      const initialQueue = [...images];
      const [first, second, ...rest] = initialQueue;
      setQueue(rest);
      setCurrentPair([first, second]);
    }
  };

  // Handle voting for one of the images
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
      // Check for ties
      const maxWins = Math.max(...images.map((img) => img.wins));
      const potentialWinners = images.filter((img) => img.wins === maxWins);

      if (potentialWinners.length > 1) {
        // Reintroduce tied images into the queue
        const tiedQueue = potentialWinners.filter(
          (img) => !currentPair.some((pairImg) => pairImg.id === img.id)
        );
        setQueue(tiedQueue);
        if (tiedQueue.length >= 2) {
          setCurrentPair([tiedQueue[0], tiedQueue[1]]);
        }
      } else {
        // Declare the final winner
        setFinalWinner(potentialWinners[0]);
        setCurrentPair([]);
      }
    }
  };

  useEffect(() => {
    if (images.length >= 4) {
      startVoting(); // Automatically start voting when 4 images are uploaded
    }
  }, [images]);

  // Reset function to clear all data
  const resetApp = () => {
    localStorage.removeItem('images'); // Clear local storage
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
              <p className="text-muted">Upload a single image. Voting will begin when 4 images are uploaded.</p>
              <div className="mb-4">
                <label className="btn btn-primary btn-lg">
                  <i className="bi bi-upload"></i> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Image (User will not see it after upload) */}
      {userImage && (
        <div className="text-center mt-4">
          <h4>You've uploaded your image!</h4>
          <div className="card shadow-lg p-3 rounded" style={{ width: '200px', margin: 'auto' }}>
            <img
              src={userImage.src}
              alt="Uploaded Image"
              className="img-fluid rounded-circle mb-3"
              style={{
                width: '200px',   // Fixed width for user uploaded image
                height: '200px',  // Fixed height for user uploaded image
                objectFit: 'cover', // Maintain image proportions inside the circle
              }}
            />
          </div>
        </div>
      )}

      {/* Show all uploaded images to users, excluding the user's own image */}
      <div className="row justify-content-center mt-4">
        {images.filter((img) => img.id !== userImage?.id).map((img) => (
          <div key={img.id} className="col-md-3 text-center mb-4">
            <div className="card shadow-lg p-3 rounded">
              <img
                src={img.src}
                alt={`Uploaded Image ${img.id}`}
                className="img-fluid rounded-circle"
                style={{
                  width: '170px',   // Fixed width for all uploaded images
                  height: '170px',  // Fixed height for all uploaded images
                  objectFit: 'cover', // Maintain aspect ratio inside the circle
                }}
              />
              <p>Wins: {img.wins}</p>
              <p>Losses: {img.losses}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Start Voting Button */}
      {!finalWinner && images.length === 4 && currentPair.length === 0 && (
        <div className="text-center my-4">
          <button className="btn btn-success btn-lg" onClick={startVoting}>
            Start Voting
          </button>
        </div>
      )}

      {/* Voting Section */}
      {!finalWinner && currentPair.length === 2 && (
        <div className="row justify-content-center mt-5">
          {currentPair.map((img) => (
            <div
              key={img.id}
              onClick={() => handleVote(img.id)}
              className="col-md-4 text-center"
              style={{ cursor: 'pointer' }}
            >
              <div className="card shadow-lg p-4 rounded">
                <img
                  src={img.src}
                  alt={`Image ${img.id}`}
                  className="img-fluid rounded-circle mb-3"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover', // Maintain the image inside the circle
                    border: '3px solid #007bff', // Optional border for distinction
                  }}
                />
                <p>Wins: {img.wins}</p>
                <p>Losses: {img.losses}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winner Section */}
      {finalWinner && (
        <div className="text-center mt-5">
          <h2>The Winner is:</h2>
          <img
            src={finalWinner.src}
            alt="Winner"
            className="img-fluid rounded-circle mb-3"
            style={{
              width: '300px',
              height: '300px',
              objectFit: 'cover',
            }}
          />
          <p>Image {finalWinner.id}</p>
          <p>Wins: {finalWinner.wins}</p>
          <p>Losses: {finalWinner.losses}</p>
        </div>
      )}

      {/* Reset Section */}
      <div className="text-center mt-5">
        <button className="btn btn-danger btn-lg" onClick={resetApp}>Reset App</button>
      </div>
    </div>
  );
};

export default App;
