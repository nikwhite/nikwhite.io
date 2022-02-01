import './App.css'
import TicTacToe from './games/tictactoe'
import Connect4 from './games/connect4'
import Go from './games/go'
import IconLink from './components/iconLink'
import DocIcon from './components/docIcon'
import portrait from './img/nik250.jpeg'

function App() {
  return (
    <div className="App">
      <header className="App-header container">
        <img src={portrait} alt="Portrait" />
        <h1>Nik White<br />
          <span>Software Engineer, Polymath, Autodidact, INTP</span>
        </h1>
      </header>
      <section className="container">
        <p>
          I've been a web engineer building things on the internet since I was a kid in the 
          early 2000s making forums and blogs for my gaming groups.
          I started building websites and office networks for small businesses 
          and individuals in high school. After studying computer science and art at 
          Northern Illinois University, I spent 8 years at JPMorgan Chase building things on 
          the internet. First websites, then I joined, and quickly led, development on a design
          system project to redesign the chase.com website and replatform the CMS behind it. I then led development
          on a payment platform for 4 years from prototype, to initial merchants, and finally mass rollout.
          Most recently, I joined Chase Online Core Javascript Platform to build shared tools, patterns, and APIs. 
          I also provided support and mentorship to over 500 engineers building 
          apps on the platform. I left in mid-2020 and I'm now actively looking for a new challenge.
        </p>
        <p>
          <a href="https://docs.google.com/document/d/e/2PACX-1vQ38zIjQZFxu1urpmR6HCwuRCa_DRHpKbgAAge2KRuiDrmn_MjbRwEJ57QzUWtTvPvihvLf7EKO94T9/pub"
            target="_blank"
            rel="noreferrer">
            <DocIcon />View my resume
          </a>
        </p>
        <h2>Find me online</h2>
        <ul className="onlineLinks">
          <li><IconLink icon="linkedin" url="https://www.linkedin.com/in/nik-white-64631740/" /></li>
          <li><IconLink icon="github" url="https://github.com/nikwhite" /></li>
          <li><IconLink icon="codepen" url="https://codepen.io/nikwhite/pens/public" /></li>
          <li><IconLink icon="imgur" url="https://imgur.com/user/nikwhite" /></li>
        </ul>
      </section>
      <section className="container">
        <h2>Games</h2>
        <p>Local multiplayer only <code>:)</code></p>
        <p>These are just coding exercises for fun. Tap the Github icon to see the code.</p>
        <div className="game">
          <TicTacToe />
        </div>
        <div className="game">
          <Connect4 />
        </div>
        <div className="game">
          <Go />
        </div>
      </section>
    </div>
  );
}

export default App
