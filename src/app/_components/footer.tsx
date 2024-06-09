import Link from "next/link";
import Image from "next/image"
import { Discord, Gmail, Instagram } from "./Logo";
import { mathAndCS, sciences, socialSciences, languages, arts} from "./Subjects"

export default function Footer() {
    return (
        <div className="w-full bg-gray-900 text-center">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 min-h-24 text-center items-start justify-center my-5">
                <Column heading="Math and CS" items={mathAndCS} />
                <Column heading="Sciences" items={sciences} />
                <Column heading="Social Sciences" items={socialSciences} />
                <Column heading="Languages" items={languages} />
                <Column heading="Arts" items={arts} />
                <div className="flex flex-col gap-4 self-center justify-self-center mt-3">
                    <Image className="mx-auto" src="/APStudents.png" alt="AP Students Logo" width="75" height="75" /> 
                    <p>AP Students</p>
                    <div className="flex flex-row">
                        <Discord />             
                        <Instagram />
                        <Gmail />
                    </div>
                </div>
            </div>
            <hr className="h-px bg-gray-200 border-0 dark:bg-gray-700" />
            <p className="text-sm py-6">&#169; Copyright {new Date().getFullYear()} - AP Students</p>
        </div>
    )
}

interface Props {
    heading: string;
    items: any;
}

const Column: React.FC<Props> = ({heading, items}) => {
    return (
        <div className="flex flex-col">
            <p className="font-bold mt-3">{heading}</p>
            {items.map((item: any) => 
                <Link 
                    href={"/"+item.split(" ").join("-").toLowerCase()} 
                    className="hover:text-white/80 hover:underline m-1 font-light text-sm">
                    {item}
                </Link>)
            }
        </div>
    )
}