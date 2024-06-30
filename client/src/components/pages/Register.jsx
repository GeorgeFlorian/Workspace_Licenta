import { useState } from "react";
import {
  Form,
  useActionData,
  useNavigation,
  Link,
} from "react-router-dom";
import { useSignup } from "@/hooks/useSignUp";


function RegisterPage() {
  const navigation = useNavigation();
  const isRegistering = !!navigation.formData?.get("username");

  const actionData = useActionData();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const {signup, error, isLoading} = useSignup()

  const handleSubmit = async (e) => {
    e.preventDefault()

    await signup(email, password)
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-lg drop-shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>

      <Form method="post" className="space-y-4">
        <div>
          <label htmlFor="email" className="block">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            disabled={isRegistering}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
          >
            {isRegistering ? "Registering..." : "Register"}
          </button>
          <Link
            to="/login"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-300 ml-4"
          >
            SignIn
          </Link>
        </div>
      </Form>
      {actionData && actionData.error && (
        <p className="text-red-500 mt-2">{actionData.error}</p>
      )}
    </div>
  );
}

export default RegisterPage;
