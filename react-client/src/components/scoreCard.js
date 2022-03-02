import './scoreCard.css'

function ScoreCard({
  counter, counterLabel, active, team, score = 0, turnActions
}) {
  const counterIsNumber = typeof counter === typeof 0
  const counterDots = []
  if (counterIsNumber) {
    for (let i=1; i <= counter; i++) {
      counterDots.push(<b key={i}>&#9679;</b>)
    }
  }

  return (
    <div className="scoreCard" role="status">
      <div className="teamStats"> 
        {!!team &&
          <h4 className="name">{team}</h4>
        }
        {counterIsNumber &&
          <figure className="counter">
            <figcaption>{counterLabel}: {counter}</figcaption>
            <div className="dots" role="presentation">
              {counterDots}
            </div>
          </figure>
        }
      </div>
      {!score && active && turnActions &&
        <div className="turnActions">
          {turnActions}
        </div>
      }
      {!!score &&
        <div className="score">
          <strong>{score}</strong>
        </div>
      }
    </div>
  )
}

export default ScoreCard