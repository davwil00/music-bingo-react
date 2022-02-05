import React from "react"
import { BrowserRouter as Router, Route, Switch, } from "react-router-dom"
import { NotFound } from "./NotFound"
import { Header } from "./components/Header/Header"
import { AdminRoutes } from "./routes/AdminRoutes"
import { GameRoutes } from "./routes/GameRoutes"
import { Bpm } from "./components/Bpm/Bpm"


export default function App() {
    return (
        <Router>
            <div>
                <Header />

                <Switch>
                    <Route path="/admin">
                        <AdminRoutes/>
                    </Route>
                    <Route path="/bpm">
                      <Bpm/>
                    </Route>
                    <Route path="/">
                        <GameRoutes/>
                    </Route>
                    <Route path="*">
                        <NotFound/>
                    </Route>
                </Switch>
            </div>
        </Router>
    )
}