"use client"
import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import { useUser } from "@/components/hooks/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ExperienceCard from "@/components/dashboard/ExperienceCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MyClasses from "@/components/dashboard/MyClasses"

export default function Dashboard() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
    if (!loading && !user) {
        router.push("/login");
    }
    }, [loading, user, router]);

    if (loading || !user) {
    return <div>Loading…</div>;
    }
    return (
    <div>
        <Navbar />
        <DashboardHeader user={user} />

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-8 py-10 md:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-8">
            <ExperienceCard />
            <p>Streak bar (placeholder)</p>
            <p>Global Stats (placeholder)</p>
            <p>Recent Activity (placeholder)</p>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
            <p>Achievements (placeholder)</p>
            <MyClasses uid={user.uid} subjectSlugs={user.mySubjects ?? []} />
            <p>Saved Pages (placeholder)</p>
        </div>
        </div>

        <Footer />
    </div>
    );

  }
