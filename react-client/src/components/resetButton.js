import './resetButton.css';

function ResetButton(props) {
    return (
        <button className="resetButton" onClick={props.onClick}>
            <code>Reset</code>
        </button>
    )
}

export default ResetButton