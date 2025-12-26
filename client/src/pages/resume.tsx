import { motion } from "framer-motion"
import { useEffect, useState } from "react"

type DisplayResumeProps = {
    file: File
}

export default function DisplayResume({ file }: DisplayResumeProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (!isLoaded) return
        console.log(document.querySelectorAll('sizer'))

    }, [isLoaded])

    useEffect(() => {
        if (!file) return

        if (file.type !== "application/pdf") {
            alert("Please select a valid PDF file")
            return
        }

        const url = URL.createObjectURL(file)
        setPdfUrl(url)
        setIsLoaded(false)

        return () => URL.revokeObjectURL(url)
    }, [file])

    return (
        <motion.div
            animate={isLoaded ? { display: 'block', opacity: 1 } : {}}
            transition={{ duration: 0.25 }}
            className="hidden opacity-0 w-full"
        >
            {pdfUrl && (
                <div className="w-full">
                    <iframe
                        src={pdfUrl}
                        className="h-[600px] w-full rounded bg-transparent overflow-hidden"
                        title="PDF Viewer"
                        onLoad={() => setIsLoaded(true)}
                    />
                </div>
            )}
        </motion.div>
    )
}

