import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import App from "./App";
import "quill-emoji/dist/quill-emoji.css";

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
   <React.StrictMode>
      <QueryClientProvider client={queryClient} >
         <App />
      </QueryClientProvider>
   </React.StrictMode>
);
