import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/" element={
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-5xl font-bold text-gray-800 mb-6">AI Interview Simulator</h1>
              <p className="text-xl text-gray-600 mb-8">Practice interviews with AI. Get instant feedback.</p>
          
              <div className="space-x-4">
                <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">Login</a>
                <a href="/register" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg">Register</a>
              </div>
          
            </div>
          } />
        
        </Routes>
      </div>
    </Router>
  );
}

export default App;