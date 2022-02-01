import './button.css';

function Button(props) {
    return (
        <button onClick={props.onClick}>
            <code>{props.children}</code>
        </button>
    )
}

export default Button