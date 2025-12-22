import axios from 'axios';
import { useEffect, useState } from 'react';
import pdfToText from 'react-pdftotext';

function Resume() {
    const [text, setText] = useState('');

    useEffect(() => {
        async function update() {
            if (text.length > 0) {
                const userInfo = await updateUserInfo(text)
                sessionStorage.setItem('user', JSON.stringify(userInfo))
            }
        }

        update()
    }, [text])

    const updateUserInfo = async (extractedText: string) => {
        try {
            const res = await axios.post('http://localhost:3000/resume', {
                resumeText: extractedText
            })

            return res.data.userInfo
        } catch (error) {
            console.error(error)
        }
    }

    const extractText = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        const file = event?.target?.files[0];
        pdfToText(file)
            .then((extractedText) => {
                setText(extractedText);
            })
            .catch((error) => {
                console.error('Failed to extract text from pdf', error);
            });
    };

    return (
        <div>
            <h1>Extract Text from PDF</h1>
            <input type="file" accept="application/pdf" onChange={extractText} />
            {text && (
                <div>
                    <h2>Extracted Text:</h2>
                    <p>{text}</p>
                </div>
            )}
            {/*<object data="ex.pdf" type="application/pdf" width="100%" height="100%"></object>
        */}</div>
    );
}

export default Resume;