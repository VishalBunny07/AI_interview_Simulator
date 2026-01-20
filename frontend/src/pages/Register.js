import { useState } from 'react';
import { registerUser } from '../utils/api';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(
        formData.full_name,
        formData.email,
        formData.password
      );
      alert('Registration successful!');
      window.location.href = '/login';
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">

      <div
        className="
          relative w-full max-w-md p-8 rounded-2xl
          bg-white/10 backdrop-blur-xl
          border border-white/20
          shadow-[0_20px_40px_rgba(0,0,0,0.45)]
          transition-all duration-300 ease-out
          hover:scale-[1.04] hover:-translate-y-2
          hover:shadow-[0_30px_60px_rgba(255,255,255,0.18)]
          overflow-hidden
          group
        "
      >
  
        <div
          className="
            pointer-events-none absolute inset-0
            before:absolute before:inset-0
            before:bg-gradient-to-tr
            before:from-transparent before:via-white/20 before:to-transparent
            before:opacity-0
            before:translate-x-[-120%] before:translate-y-[120%]
            group-hover:before:translate-x-[120%]
            group-hover:before:translate-y-[-120%]
            group-hover:before:opacity-100
            before:transition-all before:duration-700 before:ease-out
          "
        />

        <h2 className="text-3xl font-bold text-white text-center mb-2 relative z-10">
          Create Account
        </h2>

        <p className="text-center text-gray-300 mb-8 relative z-10">
          Start practicing interviews with AI
        </p>

        <form onSubmit={handleRegister} className="space-y-6 relative z-10">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            className="
              w-full px-4 py-3 rounded-lg
              bg-white/20 text-white placeholder-gray-300
              border border-white/30
              focus:outline-none focus:ring-2 focus:ring-white/40
            "
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
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
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 relative z-10">
          Already have an account?{' '}
          <a href="/login" className="text-white font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
