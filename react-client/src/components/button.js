import './button.css';

function Button(props) {
    return (
        <button onClick={props.onClick} disabled={props.disabled || false}>
            <pre>{props.children}</pre>
        </button>
    )
}

export default Button