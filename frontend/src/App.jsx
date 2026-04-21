import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminPage from './pages/AdminPage'
import TestCasesPage from './pages/TestCasesPage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/test-cases" element={<TestCasesPage />} />
            </Routes>
        </BrowserRouter>
    )
}
