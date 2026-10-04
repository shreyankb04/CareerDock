import axios from "axios"

// VITE_API_BASE_URL should point at your deployed backend (e.g. Render URL) in
// production. Falls back to the local backend so `npm run dev` keeps working
// with no .env file needed.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
})
