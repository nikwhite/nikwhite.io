import './App.css'
import TicTacToe from './games/tictactoe'
import Connect4 from './games/connect4'

function App() {
  return (
    <div className="App">
      <header className="App-header container">
        <h1>
          Nik White <br />
          <span>Software Engineer, Polymath, Autodidact, Neurodivergent, INTP</span>
        </h1>
      </header>
      <section className="container">
        <p>
          I've been a web engineer building things on the internet since the 
          early 2000s, when I was a kid, making forums and blogs for my gaming 
          groups. I started building websites and office networks for small businesses 
          and individuals in high school. After studying computer science and art at 
          Northern Illinois University I spent 8 years at JPMorgan Chase building things on 
          the internet. First websites, then I led development on a design
          system project to redesign and replatform the chase.com website and CMS. I then led development
          on a payment platform for 4 years from prototype, to initial merchants, and finally mass rollout.
          Most recently, I joined Chase Online Core Platform to build shared tools, patterns, and APIs. 
          I also provided support and mentorship to over 500 engineers building 
          apps on the platform. I left in mid-2020 and I'm now actively looking for new opportunities.
        </p>
      </section>
      <section className="container">
        <h2>Games</h2>
        <div className="game">
          <TicTacToe />
        </div>
        <div className="game">
          <Connect4 />
        </div>
      </section>
    </div>
  );
}

export default App