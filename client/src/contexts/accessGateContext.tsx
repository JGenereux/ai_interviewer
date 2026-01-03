import { createContext, useState, useContext, useEffect, ReactNode } from "react"

const STORAGE_KEY = "firstoffer_access_unlocked"

interface AccessGateContextType {
    isUnlocked: boolean
    unlock: () => void
}

const AccessGateContext = createContext<AccessGateContextType>({
    isUnlocked: false,
    unlock: () => {}
})

export const AccessGateProvider = ({ children }: { children: ReactNode }) => {
    const [isUnlocked, setIsUnlocked] = useState(() => {
        return sessionStorage.getItem(STORAGE_KEY) === "true"
    })

    useEffect(() => {
        if (isUnlocked) {
            sessionStorage.setItem(STORAGE_KEY, "true")
        }
    }, [isUnlocked])

    const unlock = () => {
        setIsUnlocked(true)
        sessionStorage.setItem(STORAGE_KEY, "true")
    }

    return (
        <AccessGateContext.Provider value={{ isUnlocked, unlock }}>
            {children}
        </AccessGateContext.Provider>
    )
}

export const useAccessGate = () => {
    const context = useContext(AccessGateContext)
    if (context === undefined) {
        throw new Error("useAccessGate must be used within an AccessGateProvider")
    }
    return context
}

