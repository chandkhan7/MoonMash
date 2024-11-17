import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const WinnerModal = ({ show, winner, onClose }) => (
  <Modal show={show} onHide={onClose}>
    <Modal.Header closeButton>
      <Modal.Title>Winner!</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <h3>{winner.name}</h3>
      <p>{winner.personality}</p>
      <img src={winner.image} alt={winner.name} style={{ width: '100%' }} />
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

export default WinnerModal;
