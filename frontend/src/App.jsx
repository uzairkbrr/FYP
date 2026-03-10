import React from 'react'
import Home from './pages/Home'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
    return (
        <ThemeProvider>
            <Home />
        </ThemeProvider>
    )
}
