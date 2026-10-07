import { RouterProvider } from "react-router";
import { router } from "./routes/router";

/*
 * App is now just the router host. It sits inside AuthProvider + QueryClientProvider
 * (see main.tsx), so every route can read auth state and use TanStack Query.
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
