import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const users = {
  admin: { password: "admin123", role: "admin" },
  user: { password: "user123", role: "user" },
};

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // clear error while typing
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    const { username, password } = formData;
    const user = users[username];

    if (user && user.password === password) {
      navigate("/home", { state: { role: user.role } });
    } else {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md border border-blue-200">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            value={formData.username}
            onChange={handleChange}
            autoComplete="off"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            value={formData.password}
            onChange={handleChange}
          />

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white transition 
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
