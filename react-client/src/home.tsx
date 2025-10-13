import React from 'react';
import './home.css'
import TicTacToe from './games/tictactoe'
import Connect4 from './games/connect4'
import Go from './games/go'
import IconLink from './components/iconLink'
import DocIcon from './components/docIcon'
import portrait from './img/nik250.jpeg'

function Home() {
  return (
    <div className="App">

      <header className="App-header container">
        <img src={portrait} alt="Portrait" />
        <h1>Nik White<br />
          <span>Software Engineer, Polymath, Autodidact, INTP</span>
        </h1>
      </header>

      <main className="container">
        <p>
          I've been building things on the internet since I was a kid
          in the early 2000s. building forums and blogs for my gaming groups before
          building websites and office networks for small businesses and individuals
          in high school.
        </p>
        <p>
          After studying computer science and art at Northern Illinois University,
          I spent 8 years at JPMorgan Chase building more things on the internet
          as a lead software engineer: websites, a drag-and-drop component-based design
          system on a new chase.com CMS, a payment platform, and finally Chase Online
          Core Javascript Platform to build shared tools, patterns, and APIs.
        </p>
        <p>
          I joined Etsy in 2022 to join the mission: supporting independent makers and
          small businesses by keeping commerce human. I'm a Staff Software Engineer 
          working on the Frontend Infrastructure team supporting all of our frontend
          tooling and in-house PHP Framework.
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
          <li>
            <IconLink icon="linkedin" url="https://www.linkedin.com/in/nik-white-64631740/" />
          </li>
          <li>
            <IconLink icon="github" url="https://github.com/nikwhite" />
          </li>
          <li>
            <IconLink icon="codepen" url="https://codepen.io/nikwhite/pens/public" />
          </li>
        </ul>

        <section className="container">
          <h2>Games</h2>
          <p>Local multiplayer only, for now... <code>:)</code></p>
          <p>These are coding exercises for fun. Tap the Github icon to see the code.</p>
          <TicTacToe />
          <div className="game">
            <Connect4 />
          </div>
          <div className="game">
            <Go />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home
