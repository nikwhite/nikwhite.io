import React from 'react';
import './button.css';

export function BackButton({
  onClick = () => window.history.back(),
  disabled = false
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: 'none',
      border: 'none',
      padding: '8px 16px',
      cursor: 'pointer',
      marginBottom: '16px',
      fontSize: '18px',
    }}>
      <span style={{
        display: "inline-block",
        transform: "scaleX(-1)",
      }}>➼</span> Back
    </button>
  )
}
