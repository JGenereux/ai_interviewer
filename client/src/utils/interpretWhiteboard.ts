const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class WhiteboardTooLargeError extends Error {
    constructor() {
        super('The whiteboard contains too much content to analyze at once.')
        this.name = 'WhiteboardTooLargeError'
    }
}

/**
 * Sends a whiteboard image to the backend for GPT-4 Vision interpretation
 * @param dataUrl - Base64 data URL of the whiteboard image
 * @param authToken - Authorization token for the API
 * @returns A text description of what's drawn on the whiteboard
 */
export async function interpretWhiteboard(dataUrl: string, authToken: string | null): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/vision/interpret-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ image: dataUrl }),
        })

        if (response.status === 413) {
            throw new WhiteboardTooLargeError()
        }

        if (!response.ok) {
            throw new Error(`Failed to interpret whiteboard: ${response.statusText}`)
        }

        const data = await response.json()
        return data.interpretation
    } catch (error) {
        console.error('Error interpreting whiteboard:', error)
        throw error
    }
}

