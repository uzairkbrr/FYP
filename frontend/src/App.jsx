import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )
}
