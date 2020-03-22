import React, { useEffect, useState } from "react"
import { BrowserRouter as Router, Link, Route, Switch, Redirect, } from "react-router-dom"
import { BingoSheet } from "./components/Bingo/BingoSheet"
import { Games } from "./components/Games/Games"
import { WaitingRoom } from "./components/WaitingRoom/WaitingRoom"
import { WebSocketController } from "./components/WebSocketController/WebSocketController"

interface WebSocketState {
  ws?: WebSocket
}

export interface GameState {
    gameId?: string
    players: Array<string>
    joined: boolean
    ticketNo?: number,
    started: boolean
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({players: [], joined: false, started: false})
  const [webSocketState, setWebSocketState] = useState<WebSocketState>({})

  useEffect(init, [])

  return (
      <Router>
        { webSocketState.ws &&
          <WebSocketController ws={webSocketState.ws}
                               gameState={gameState}
                               setGameState={setGameState} /> }
        <div>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>

          <hr />

          <Switch>
            <Route exact path="/">
                { webSocketState.ws ? <Games ws={webSocketState.ws}/> : <p>Server offline</p> }
            </Route>
            <PrivateRoute exact path="/waiting-room" condition={gameState.joined}>
              <WaitingRoom currentPlayers={gameState.players}/>
            </PrivateRoute>
            <PrivateRoute path="/:gameId/:ticketId" children={<BingoSheet gameState={gameState}/>} condition={gameState.ticketNo !== undefined}/>
          </Switch>
        </div>
      </Router>
  );

  function init() {
    const ws = new WebSocket(`ws://${window.location.hostname}/socket`)
    ws.onopen = () => {
      setWebSocketState({ws: ws})
      console.log('web socket opened')
    }
    ws.onclose = () => {
        setWebSocketState({ws: undefined})
    }
  }

  // @ts-ignore
    function PrivateRoute({ children, condition, ...rest }) {
    return (
        <Route
            {...rest}
            render={({ location }) =>
                (true || condition) ? (
                    children
                ) : (
                    <Redirect
                        to={{
                          pathname: "/",
                          state: { from: location }
                        }}
                    />
                )
            }
        />
    );
  }
}