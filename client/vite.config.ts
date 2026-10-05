import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "redux-vendor",
              test: /node_modules[\\/](@reduxjs|react-redux|redux|immer|reselect)[\\/]/,
            },
            {
              name: "ui-vendor",
              test: /node_modules[\\/](@base-ui|lucide-react|sonner|class-variance-authority)[\\/]/,
            },
          ],
        },
      },
    },
  },
})