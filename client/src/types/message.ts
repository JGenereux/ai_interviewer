export type Message = {
    role: 'user' | 'agent',
    id: string,
    content: string,
    event_id: string,
    created: number
}