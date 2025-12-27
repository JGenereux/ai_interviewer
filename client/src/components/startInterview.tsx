import { useState, type Dispatch, type SetStateAction } from "react";
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

export default function StartInterview({ setStartInterview }: { setStartInterview: Dispatch<SetStateAction<boolean>> }) {
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

    return <Card className="self-center mx-auto flex flex-col items-center bg-transparent border-0 w-72">
        {options?.map((op) => {
            return <ValueSelector option={op.option} values={op.values} handleChangeInfo={handleChangeInfo} />
        })}
        <Button onClick={() => setStartInterview(true)} className="cursor-pointer bg-white text-black w-fit font-btn-font focus:bg-white hover:bg-white">Begin Interview</Button>


    </Card>
}

function ValueSelector({ option, values, handleChangeInfo }: ValueProps) {
    return <Select onValueChange={(v) => handleChangeInfo(option, v)}>
        <SelectTrigger className="w-[180px] text-white">
            <SelectValue placeholder={option} />
        </SelectTrigger>
        <SelectContent className="bg-[#181818] text-white">
            {values?.map((v, i) => {
                return <SelectItem key={i} value={v} className="focus:bg-[#121212] focus:text-white">{v}</SelectItem>
            })}
        </SelectContent>
    </Select>
}