import Navbar from "@/components/global/navbar";
import Footer from "@/components/global/footer";
import TeamHive from "@/components/team/TeamHive";

export default function TeamPage() {
  return (
    <>
      <Navbar className="bg-primary-foreground" />
      
      <main className="min-h-screen bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-4">
              Meet Our Team
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals behind FiveHive, working together to create amazing AP resources for students.
            </p>
          </div>
          
          <TeamHive />
        </div>
      </main>
      
      <Footer />
    </>
  );
}