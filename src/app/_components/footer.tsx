import Link from "next/link";
import { Discord, Gmail, Instagram } from "./logo";

export default function Footer() {
    const mathAndCS = ["AP Calculus AB", "AP Calculus BC", "AP Statistics", "AP Computer Science Principles", "AP Computer Science A"]
    const sciences = ["AP Biology", "AP Chemistry", "AP Environmental Science", "AP Physics 1", "AP Physics 2", "AP Physics C: E&M", "AP Physics C: M"]
    const socialSciences = ["AP Psychology", "AP European History", "AP United States History", "AP World History", "AP Microeconomics", "AP Macroeconomics", "AP Human Geography", "AP Comparative Government and Politics", "AP US Government and Politics"]
    const language = ["AP English Language", "AP English Literature", "AP Spanish Language", "AP Spanish Literature", "AP Chinese", "AP French", "AP German", "AP Italian", "AP Japanese", "AP Latin"]
    const arts =  ["AP 2D Art and Design", "AP 3D Art and Design", "AP Drawing", "AP Art History", "AP Biology", "AP Music Theory", "AP Research", "AP Seminar" ]
    return (
        <div className="w-screen bg-gray-900 text-center">
            <div className="flex flex-col sm:flex-row min-h-24 text-center items-center justify-center py-5">
                <div className="w-1/6 flex flex-col flex-wrap lg:h-96 justify-left">
                    <p>Math and CS</p>
                    {mathAndCS.map((item) => <Link href="" className="hover:text-white/80 hover:underline-offset-2 m-1 font-light text-sm">{item}</Link>)}
                </div>
                <div className="w-1/6 flex flex-col flex-wrap lg:h-96 justify-left">
                    <p>Sciences</p>
                    {sciences.map((item) => <Link href="" className="hover:text-white/80 hover:underline-offset-2 m-1 font-light text-sm">{item}</Link>)}
                </div>
                <div className="w-1/6 flex flex-col flex-wrap lg:h-96 justify-left">
                    <p>Social Sciences</p>
                    {socialSciences.map((item) => <Link href="" className="hover:text-white/80 hover:underline-offset-2 m-1 font-light text-sm">{item}</Link>)}
                </div>
                <div className="w-1/6 flex flex-col flex-wrap lg:h-96 justify-left">
                    <p>Languages</p>
                    {language.map((item) => <Link href="" className="hover:text-white/80 hover:underline-offset-2 m-1 font-light text-sm">{item}</Link>)}
                </div>
                <div className="w-1/6 flex flex-col flex-wrap lg:h-96 justify-left">
                    <p>Arts</p>
                    {arts.map((item) => <Link href="" className="hover:text-white/80 hover:underline-offset-2 m-1 font-light text-sm">{item}</Link>)}
                </div>
                <div className="w-1/6 flex flex-col">
                    [Logo] AP Students
                    <div className="flex flex-row text-center align-center justify-center pt-8">
                        <Instagram />
                        <Discord />             
                        <Gmail />
                    </div>
                </div>
            </div>
            <hr className="h-px bg-gray-200 border-0 dark:bg-gray-700" />
            <p className="text-sm py-6">&#169; Copyright 2024 - AP Students</p>
        </div>
    )
}