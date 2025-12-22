import { Link, useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { SignalIcon } from "./icons/signalIcon";

export default function Navbar() {
    const navigate = useNavigate()
    const links = [
        { path: '/', name: 'Home' },
        { path: '/interview', name: 'Interview' },
        { path: '/practice', name: 'Practice' }
    ]

    return <Card className="relative shadow-[#302e2e] shadow-sm bg-transparent flex flex-row w-full border-0 rounded-none py-3 px-6 items-center">
        {links?.map((l, i) => <Link className="text-white font-nav-font text-sm" key={i} to={l.path}>{l.name}</Link>)}
        <div onClick={() => navigate('/login')} className="flex flex-row items-center ml-auto w-fit gap-4 cursor-pointer">
            <p className="text-neutral-400 tracking-wide font-nav-font text-xs">Sign In</p>
            <SignalIcon className="w-6 h-6 text-neutral-300 hover:text-white transition" />
        </div>
    </Card>
}