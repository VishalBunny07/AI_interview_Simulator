import { useState } from 'react';
import { loginUser } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(email, password);
      sessionStorage.setItem("user_id", response.user_id);
      alert('Login successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Login failed!');
    }
  };

      return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">

        <div
          className="
            relative w-full max-w-md p-8 rounded-2xl
            bg-white/10 backdrop-blur-xl
            border border-white/20
            shadow-[0_20px_40px_rgba(0,0,0,0.4)]
            transition-all duration-300 ease-out
            hover:scale-[1.04] hover:-translate-y-2
            hover:shadow-[0_30px_60px_rgba(255,255,255,0.15)]
            group
          "
        >
      
          <div
            className="
              absolute inset-0 rounded-2xl
              bg-gradient-to-tr from-white/10 to-transparent
              opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              pointer-events-none
            "
          />

          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Welcome Back
          </h2>

          <p className="text-center text-gray-300 mb-8">
            Login to continue your AI interview practice
          </p>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-white/20 text-white placeholder-gray-300
                border border-white/30
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-white/20 text-white placeholder-gray-300
                border border-white/30
                focus:outline-none focus:ring-2 focus:ring-white/40
              "
              required
            />

            <button
              type="submit"
              className="
                w-full py-3 rounded-xl
                bg-white text-slate-900
                font-semibold text-lg
                transition-transform
                hover:scale-[1.02]
              "
            >
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 relative z-10">
            Don’t have an account?{" "}
            <a href="/register" className="text-white font-semibold hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    );


}