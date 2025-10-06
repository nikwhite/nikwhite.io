import type React from 'react'
import React from 'react';
import './button.css';

interface ButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

function Button({ onClick, disabled, children }: ButtonProps) {
    return (
        <button onClick={onClick} disabled={disabled || false}>
            <pre>{children}</pre>
        </button>
    )
}

export default Button