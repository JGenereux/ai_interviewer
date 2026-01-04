import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { exportToBlob } from "@excalidraw/excalidraw";

export function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function captureWhiteboardImage(api: ExcalidrawImperativeAPI): Promise<string> {
    const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: api.getAppState(),
        files: api.getFiles(),
        getDimensions: () => ({ width: 1024, height: 768 }),
        mimeType: "image/jpeg",
        quality: 0.7,
        exportPadding: 5,
    });
    return blobToDataURL(blob);
}

type WhiteboardProps = {
    height: number | string
    width: number | string
    onAPIReady?: (api: ExcalidrawImperativeAPI) => void
}

export default function Whiteboard({ height, width, onAPIReady }: WhiteboardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

    useEffect(() => {
        if (excalidrawAPI && onAPIReady) {
            onAPIReady(excalidrawAPI);
        }
    }, [excalidrawAPI, onAPIReady]);

    return (
        <div style={{ height, width }}>
            <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                theme="dark"
            />
        </div>
    )
}
