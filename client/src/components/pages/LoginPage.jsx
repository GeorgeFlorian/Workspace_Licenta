import { useState } from "react";
import { Form, useLocation, Link } from "react-router-dom";
import { useLogin } from "@/hooks/useLogin.js";

function LoginPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const from = params.get("from") || "/";

  const { login, isLoading, error } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    await login(username, password);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-lg drop-shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>

      <Form method="post" className="space-y-4" onSubmit={onSubmit}>
        <input type="hidden" name="redirectTo" value={from} />
        <div>
          <label htmlFor="username" className="block">
            Username:
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <Link
            to="/register"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-300 ml-4"
          >
            Register
          </Link>
        </div>
      </Form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default LoginPage;
