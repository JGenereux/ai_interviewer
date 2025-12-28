import type { Dispatch, SetStateAction } from "react";
import { CodeEditorIcon } from "../icons/codeEditor";
import { ConversationIcon } from "../icons/conversation";
import { WhiteboardIcon } from "../icons/whiteboard";
import { Card } from "../ui/card";
import StopWatch from "./stopwatch";

export default function ToolBar({ setCurrentToolbarOption }: { setCurrentToolbarOption: Dispatch<SetStateAction<"whiteboard" | "editor">> }) {
    return <Card className="gap-3 flex flex-row items-center justify-center bg-transparent border-0 h-fit w-fit">
        <div className="flex flex-row gap-4 h-fit w-32 items-center justify-center rounded-full text-white">
            <StopWatch />
        </div>

        <div className="flex flex-row h-fit gap-4 w-fit items-center px-4">
            <ConversationIcon size={24} />
            <WhiteboardIcon setCurrentToolbarOption={setCurrentToolbarOption} size={24} />
            <CodeEditorIcon setCurrentToolbarOption={setCurrentToolbarOption} size={24} />
        </div>
    </Card>
}
