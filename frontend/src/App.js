import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  const isLoggedIn = !!sessionStorage.getItem("user_id");

  return (
    <Router>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/register"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        <Route
          path="/dashboard"
          element={
            isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_70%)]"></div>
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-10 max-w-5xl text-center px-6">
                  <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                    AI Interview Simulator
                  </h1>

                  <p className="text-xl md:text-2xl text-gray-200 mb-10">
                    Practice real interviews with AI.<br />
                    Get instant feedback, follow-ups, and skill-wise scoring.
                  </p>

                  <div className="flex justify-center gap-6 flex-wrap">
                    <a
                      href="/login"
                      className="px-10 py-4 rounded-xl bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-blue-900 transition-all"
                    >
                      Login
                    </a>

                    <a
                      href="/register"
                      className="px-10 py-4 rounded-xl bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-blue-900 transition-all"
                    >
                      Register
                    </a>
                  </div>

                  <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {[
                      {
                        title: "Live AI Interviewer",
                        desc: "Dynamic follow-ups, reactions & real interview pressure."
                      },
                      {
                        title: "Instant Scoring",
                        desc: "Skill-wise breakdown: Technical, Clarity & Communication."
                      },
                      {
                        title: "Resume-Based Questions",
                        desc: "Questions generated directly from your resume."
                      }
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition"
                      >
                        <h3 className="text-xl font-semibold mb-2">
                          {f.title}
                        </h3>
                        <p className="text-gray-200">
                          {f.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-12 text-sm text-gray-300">
                    Built to simulate real interviews • Designed to make you confident
                  </p>
                </div>
              </div>
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;