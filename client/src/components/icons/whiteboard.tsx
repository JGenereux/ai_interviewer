export function WhiteboardIcon({ size = 20 }: { size?: number }) {
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
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M7 8h5" />
            <path d="M7 11h9" />
            <path d="M10 20h4" />
        </svg>
    );
}