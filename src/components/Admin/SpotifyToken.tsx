import React from "react"
import { useLocation } from "react-router-dom"

export const SpotifyToken = () => {
    const urlParams = new URLSearchParams(useLocation().search);

    return (
        <p>Code: <pre>{urlParams.get('code')}</pre></p>
    )
}