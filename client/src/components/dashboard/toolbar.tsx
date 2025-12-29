import { CodeEditorIcon } from "../icons/codeEditor";
import { ConversationIcon } from "../icons/conversation";
import { WhiteboardIcon } from "../icons/whiteboard";
import { Card } from "../ui/card";
import StopWatch from "./stopwatch";

type ToolBarProps = {
    requestToolbarSwitch: (target: 'whiteboard' | 'editor') => void
}

export default function ToolBar({ requestToolbarSwitch }: ToolBarProps) {
    return <Card className="gap-3 flex flex-row items-center justify-center bg-transparent border-0 h-fit w-fit">
        <div className="flex flex-row gap-4 h-fit w-32 items-center justify-center rounded-full text-white">
            <StopWatch />
        </div>

        <div className="flex flex-row h-fit gap-4 w-fit items-center px-4">
            <ConversationIcon size={24} />
            <WhiteboardIcon requestToolbarSwitch={requestToolbarSwitch} size={24} />
            <CodeEditorIcon requestToolbarSwitch={requestToolbarSwitch} size={24} />
        </div>
    </Card>
}
