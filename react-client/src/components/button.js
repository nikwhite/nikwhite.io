import './button.css';

function Button(props) {
    return (
        <button onClick={props.onClick}>
            <pre>{props.children}</pre>
        </button>
    )
}

export default Button