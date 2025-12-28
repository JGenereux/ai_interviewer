import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState, type RefObject } from "react";
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

export default function Whiteboard({ session, height, width }: { session: RefObject<RealtimeSession<unknown> | null>, height: number, width: number }) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    useEffect(() => {
        async function handle() {
            if (excalidrawAPI && session.current) {
                session.current.on('agent_tool_end', async (_context, _agent, _tool) => {
                    if (_tool.name != 'get_whiteboard_image') return
                    const blob = await exportToBlob({
                        elements: excalidrawAPI.getSceneElements(),
                        appState: excalidrawAPI.getAppState(),
                        files: excalidrawAPI.getFiles(),
                        getDimensions: () => ({ width: 500, height: 500 }),
                        mimeType: "image/png",
                        exportPadding: 5,
                    });

                    const dataUrl = await blobToDataURL(blob)

                    if (session.current) {
                        console.log('sent image?')
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