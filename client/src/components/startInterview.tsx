import { useState } from "react";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";

type ValueProps = {
    option: string,
    values: string[],
    handleChangeInfo: (option: string, value: string) => void
}

const options = [
    {
        option: 'Domain Of Interest',
        values: [
            'Software Engineering',
            'Devops',
            'Information Technologies'
        ]
    },
    {
        option: 'Experience',
        values: [
            '0 Years',
            '6-12 Months',
            '2-5 Years',
            '10 Years'
        ]
    },
    {
        option: 'Weaknesses',
        values: [
            'Communicating how to solve a coding problem',
            'Staying on task when explaining past experiences',
            'Unable to write code well under pressure'
        ]
    }
]

export default function StartInterview({ startAgent }: { startAgent: () => Promise<void> }) {
    const [info, setInfo] = useState<{ option: string, value: string }[]>([])

    const handleChangeInfo = (option: string, value: string) => {
        let currInfo = info;
        const i = currInfo.findIndex((l) => l.option === option)
        if (i === -1) {
            setInfo([...currInfo, { option, value }])
        } else {
            currInfo[i] = { option, value };
            setInfo(currInfo)
        }
    }

    return <Card className="self-center mx-auto justify-center gap-12 flex flex-row h-[90%] bg-transparent border-0 w-fit">
        <div className="flex flex-col items-center gap-4 self-center">
            {options?.map((op) => {
                return <ValueSelector option={op.option} values={op.values} handleChangeInfo={handleChangeInfo} />
            })}
            <span className="underline hover:text-gray-200 cursor-pointer text-gray-400">Questions?</span>
            <Button onClick={startAgent} className="cursor-pointer bg-white text-black w-fit font-btn-font focus:bg-white hover:bg-white">Begin Interview</Button>
        </div>
        <div className="flex flex-col w-[40%]">
            <div className="flex flex-col">
                <h3 className="text-white font-btn-font text-xl underline">How this interview works</h3>
                <p className="font-nav-font text-white">We use your resume to understand your skills, experience, and qualifications.
                    This helps identify strengths and areas to improve, so the interview matches your background and goals.
                    We also study real interview conversations to make the experience feel natural and familiar.
                    The result is practice that feels close to a real interview.</p>
            </div>
            <div className="flex flex-col">
                <h3 className="text-white font-btn-font text-lg underline">What happens next?</h3>
                <p className="font-nav-font text-white">First, you will be greeted by the interviewer and a few technical questions will be asked. Then you will be moved on to a coding interview where you will solve one or two problems. You can run your code, get hints, and ask questions at any time. Good luck!</p>
            </div>
        </div>
    </Card>
}

function ValueSelector({ option, values, handleChangeInfo }: ValueProps) {
    return <Select onValueChange={(v) => handleChangeInfo(option, v)}>
        <SelectTrigger className="w-[250px] text-white">
            <SelectValue placeholder={option} />
        </SelectTrigger>
        <SelectContent className="bg-[#181818] text-white">
            {values?.map((v, i) => {
                return <SelectItem key={i} value={v} className="focus:bg-[#121212] focus:text-white">{v}</SelectItem>
            })}
        </SelectContent>
    </Select>
}