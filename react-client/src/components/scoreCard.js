import './scoreCard.css'

function ScoreCard({
  counter, counterLabel, active, team, score = 0, turnActions
}) {
  const counterDots = []
  for (let i=1; i <= counter; i++) {
    counterDots.push(<b key={i}>&#9679;</b>)
  }
  return (
    <div className="scoreCard">
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
      <div className="teamStats"> 
        <span className="name">{team}</span>
        {typeof counter === typeof 0 &&
          <figure className="counter">
            <div className="dots" role="presentation">
              {counterDots}
            </div>
            <figcaption>{counterLabel}: {counter}</figcaption>
          </figure>
        }
      </div>
    </div>
  )
}

export default ScoreCard