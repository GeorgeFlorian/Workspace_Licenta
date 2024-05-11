import { useState } from "react";
import {
  Form,
  useActionData,
  useLocation,
  useNavigation,
} from "react-router-dom";

function Login() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const from = params.get("from") || "/";

  const navigation = useNavigation();
  const isLoggingIn = !!navigation.formData?.get("username");

  const actionData = useActionData();

  const [username, setUsername] = useState("");

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>

      <Form method="post" className="space-y-4">
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
          <button
            type="submit"
            disabled={isLoggingIn}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </div>
      </Form>
      {actionData && actionData.error && (
        <p className="text-red-500 mt-2">{actionData.error}</p>
      )}
    </div>
  );
}

export default Login;
