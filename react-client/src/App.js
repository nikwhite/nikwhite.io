import './App.css'
import TicTacToe from './games/tictactoe'

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
          Northern Illinoi University I spent 8 years at JPMorgan Chase building things on 
          the internet. First websites, then I led development on a design
          system project for redesigning and replatforming the chase.com CMS. I then led development
          on a payment platform for 4 years. Then I moved to the Chase Online
          Core Platform to build shared tools, patterns, and APIs. 
          I also provided support and mentorship to over 500 engineers building 
          apps on the platform. I left in mid-2020 and I'm now actively looking for new oppotunities.
        </p>
      </section>
      <section className="container">
        <h2>Games</h2>
        <h3>TicTacToe</h3>
        <TicTacToe />
      </section>
    </div>
  );
}

export default App
