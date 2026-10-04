import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import AppLayout from "./components/layout/AppLayout.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import HelpCenter from "./pages/HelpCenter.jsx";
import AiStatus from "./pages/AiStatus.jsx";


export const router = createBrowserRouter([
    {
        // Shared shell (Navbar + Footer + page transition) around every route below.
        // Paths are unchanged from before - only the nesting structure is new.
        element: <AppLayout />,
        children: [
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/verify-email",
                element: <VerifyEmail />
            },
            {
                path: "/forgot-password",
                element: <ForgotPassword />
            },
            {
                path: "/",
                element: <Protected><Home /></Protected>
            },
            {
                path: "/interview/:interviewId",
                element: <Protected><Interview /></Protected>
            },
            {
                path: "/privacy-policy",
                element: <PrivacyPolicy />
            },
            {
                path: "/terms-of-service",
                element: <TermsOfService />
            },
            {
                path: "/help-center",
                element: <HelpCenter />
            },
            {
                path: "/ai-status",
                element: <AiStatus />
            }
        ]
    }
])
