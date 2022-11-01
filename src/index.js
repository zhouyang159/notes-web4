import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import App from "./App";

const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 60000,
      }
   }
});

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
   <QueryClientProvider client={queryClient} >
      <App />
   </QueryClientProvider>
);
