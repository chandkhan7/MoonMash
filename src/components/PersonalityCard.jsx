import React from 'react';
import { Card } from 'react-bootstrap';

const PersonalityCard = ({ person, onClick }) => (
  <Card className="text-center" style={{ width: '18rem', cursor: 'pointer' }}>
    <Card.Img variant="top" src={person.image} />
    <Card.Body>
      <Card.Title>{person.name}</Card.Title>
      <Card.Text>{person.personality}</Card.Text>
      <button className="btn btn-primary" onClick={onClick}>
        Vote
      </button>
    </Card.Body>
  </Card>
);

export default PersonalityCard;
