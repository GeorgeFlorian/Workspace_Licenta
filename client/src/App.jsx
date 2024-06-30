import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "@/context/AuthContext.jsx";
import { router } from "@/components/router/index.jsx";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function App() {
  return (
    <AuthContextProvider>
      <RouterProvider
        router={router}
        fallbackElement={<p>Initial Load...</p>}
      />
    </AuthContextProvider>
  );
}

export default App;
