import React from 'react';
import './button.css';

export function BackButton({ disabled = false }) {
  return (
    <button onClick={() => window.history.back()} disabled={disabled}>
      ← Back
    </button>
  )
}
