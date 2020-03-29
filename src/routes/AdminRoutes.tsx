import { Route, useRouteMatch, Switch } from "react-router-dom"
import { Login } from "../components/Admin/Login"
import { CreateGame } from "../components/Admin/CreateGame/CreateGame"
import { ManageGame } from "../components/Admin/ManageGame"
import { SpotifyToken } from "../components/Admin/SpotifyToken"
import React from "react"
import { Admin } from "../components/Admin/Admin"

export const AdminRoutes = () => {
    const { path } = useRouteMatch();

    return (
        <div>
            <p>this is the admin page</p>
        <Switch>
            <Route exact path={path}>
                <Admin />
            </Route>
            <Route exact path={`${path}/login`}>
                <Login/>
            </Route>
            <Route exact path={`${path}/create-game`}>
                <CreateGame/>
            </Route>
            <Route exact path={`${path}/game/:gameId`}>
                <ManageGame />
            </Route>
            <Route path={`${path}/spotify-token`}>
                <SpotifyToken/>
            </Route>
        </Switch>
        </div>
    )
}