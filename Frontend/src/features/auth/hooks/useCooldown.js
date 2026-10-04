import { useState, useEffect, useCallback } from "react"

/**
 * @description Drives a "resend in Ns" countdown for OTP resend buttons.
 * Call start(seconds) after a successful send; isActive stays true until it hits 0.
 */
export function useCooldown() {
    const [secondsLeft, setSecondsLeft] = useState(0)

    useEffect(() => {
        if (secondsLeft <= 0) return
        const timer = setInterval(() => {
            setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [secondsLeft])

    const start = useCallback((seconds) => setSecondsLeft(seconds), [])

    return { secondsLeft, start, isActive: secondsLeft > 0 }
}
