import { useAuth } from "../hooks/useAuth"
import { Navigate } from "react-router"
import "../../../components/ui/ui.scss"


const Protected = ({ children }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main className='cd-loading-screen'>
                <span className='cd-spinner' />
                <h1>Checking your session...</h1>
            </main>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }
    return children
}


export default Protected