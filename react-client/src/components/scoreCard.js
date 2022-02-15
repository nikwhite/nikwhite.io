import './scoreCard.css'

function ScoreCard({captures = 0, active, team, score = 0, turnActions}) {
  let capturedNodes = []
  for (let i=1; i <= captures; i++) {
    capturedNodes.push(<b>&#9679;</b>)
  }
  return (
    <div className="scoreCard">
      {score <= 0 && active && turnActions &&
        <div className="turnActions">
          {turnActions}
        </div>
      }
      {score > 0 && 
        <div className="score">
          <strong>{score}</strong>
        </div>
      }
      <div className="teamStats"> 
        <span className="name">{team}</span>
        {typeof captures === typeof 0 &&
          <figure className="captures">
            <div className="prisoners" role="presentation">
              {capturedNodes}
            </div>
            <figcaption>Captures: {captures}</figcaption>
          </figure>
        }
      </div>
    </div>
  )
}

export default ScoreCard