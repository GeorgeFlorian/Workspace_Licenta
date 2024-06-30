import { useState } from "react";
import { Form, Link } from "react-router-dom";
import { useSignup } from "@/hooks/useSignUp";

function RegisterPage() {
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
  });
  const { signup, error, isLoading } = useSignup();

  const setValue = (key) => (e) => {
    setNewUser({ ...newUser, [key]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await signup(newUser);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-lg drop-shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>

      <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={newUser.email}
            onChange={(e) => setValue("email")(e)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="firstName" className="block">
            First Name:
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={newUser.firstName}
            onChange={(e) => setValue("firstName")(e)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block">
            Last Name:
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={newUser.lastName}
            onChange={(e) => setValue("lastName")(e)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="username" className="block">
            Username:
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={newUser.username}
            onChange={(e) => setValue("username")(e)}
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
            value={newUser.password}
            onChange={(e) => setValue("password")(e)}
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
            {isLoading ? "Registering..." : "Register"}
          </button>
          <Link
            to="/login"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-300 ml-4"
          >
            SignIn
          </Link>
        </div>
      </Form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default RegisterPage;
