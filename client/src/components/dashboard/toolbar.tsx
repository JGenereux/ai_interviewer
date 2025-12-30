import StopWatch from "./stopwatch";

type ToolBarProps = {
    requestToolbarSwitch: (target: 'whiteboard' | 'editor') => void;
    currentOption: 'whiteboard' | 'editor';
}

export default function ToolBar({ requestToolbarSwitch, currentOption }: ToolBarProps) {
    return (
        <div className="flex flex-col gap-4 items-center">
            <StopWatch />
            
            <div className="segmented-control flex flex-row">
                <button
                    onClick={() => requestToolbarSwitch('whiteboard')}
                    className={`segmented-btn flex items-center gap-2 ${currentOption === 'whiteboard' ? 'active' : ''}`}
                >
                    <WhiteboardSvg />
                    <span>Board</span>
                </button>
                <button
                    onClick={() => requestToolbarSwitch('editor')}
                    className={`segmented-btn flex items-center gap-2 ${currentOption === 'editor' ? 'active' : ''}`}
                >
                    <CodeSvg />
                    <span>Code</span>
                </button>
            </div>
        </div>
    );
}

function WhiteboardSvg() {
    return (
        <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
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

function CodeSvg() {
    return (
        <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
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
