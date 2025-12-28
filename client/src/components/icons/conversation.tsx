export function ConversationIcon({ size = 20 }: { size?: number }) {
    return (
        <svg
            className="cursor-pointer"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 10.5C3 7.5 5.5 5 9 5h4c3.5 0 6 2.5 6 5.5S16.5 16 13 16H9l-4 3v-3.5c-1.5-1-2-2.5-2-5z" />
            <path d="M9 9.5h6" />
            <path d="M9 12.5h4" />
        </svg>
    );
}