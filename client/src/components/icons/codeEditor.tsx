export function CodeEditorIcon({ size = 20 }: { size?: number }) {
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
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M8 9l-2 3 2 3" />
            <path d="M16 9l2 3-2 3" />
            <path d="M11 14h2" />
        </svg>
    );
}