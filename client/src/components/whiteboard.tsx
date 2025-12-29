import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState, useRef, type RefObject } from "react";
import { exportToBlob } from "@excalidraw/excalidraw";
import type { RealtimeSession } from "@openai/agents/realtime";

function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

type WhiteboardProps = {
    session: RefObject<RealtimeSession<unknown> | null>
    height: number
    width: number
    currentToolbarOption: 'whiteboard' | 'editor'
    agentName: string
}

export default function Whiteboard({ session, height, width, currentToolbarOption, agentName }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const captureAndSendWhiteboard = async () => {
        if (!excalidrawAPI || !session.current) return

        const blob = await exportToBlob({
            elements: excalidrawAPI.getSceneElements(),
            appState: excalidrawAPI.getAppState(),
            files: excalidrawAPI.getFiles(),
            getDimensions: () => ({ width: 1280, height: 1080 }),
            mimeType: "image/png",
            exportPadding: 5,
        });

        const dataUrl = await blobToDataURL(blob)
        session.current.addImage(dataUrl, { triggerResponse: false })
        session.current.sendMessage(`PINGED MESSAGE! DO NOT MENTION THIS MESSAGE. This is the user's current whiteboard. If they have been stuck for a while or look lost then ask them a guiding question.`)
    }

    useEffect(() => {
        if (agentName !== 'Problem Interviewer') return
        if (currentToolbarOption !== 'whiteboard') {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        intervalRef.current = setInterval(captureAndSendWhiteboard, 20000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [currentToolbarOption, agentName, excalidrawAPI])

    useEffect(() => {
        async function handle() {
            if (excalidrawAPI && session.current) {
                session.current.on('agent_tool_end', async (_context, _agent, _tool) => {
                    if (_tool.name != 'get_whiteboard_image') return
                    const blob = await exportToBlob({
                        elements: excalidrawAPI.getSceneElements(),
                        appState: excalidrawAPI.getAppState(),
                        files: excalidrawAPI.getFiles(),
                        getDimensions: () => ({ width: 1280, height: 1080 }),
                        mimeType: "image/png",
                        exportPadding: 5,
                    });

                    const dataUrl = await blobToDataURL(blob)

                    if (session.current) {
                        session.current.addImage(dataUrl, { triggerResponse: false })
                    }
                })
            }
        }
        handle()
    }, [excalidrawAPI])

    return <div style={{ height, width }}>
        <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
    </div>
}