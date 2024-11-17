import React from 'react';

const VoteButton = ({ onVote, text }) => (
  <button className="btn btn-success mx-2" onClick={onVote}>
    {text}
  </button>
);

export default VoteButton;
