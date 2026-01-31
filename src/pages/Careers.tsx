import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock } from "lucide-react";

const openPositions = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: 2,
    title: "Machine Learning Engineer",
    department: "AI/ML",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: 3,
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    id: 4,
    title: "Customer Success Manager",
    department: "Support",
    location: "Remote",
    type: "Full-time",
  },
];

const benefits = [
  "Competitive salary & equity",
  "100% remote work",
  "Flexible working hours",
  "Health insurance",
  "Learning & development budget",
  "Home office setup allowance",
  "Unlimited PTO",
  "Team retreats",
];

const Careers = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build the future of AI-powered tools for creative professionals. 
              We're looking for passionate people who want to make a difference.
            </p>
          </div>

          {/* Benefits */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">Why Work With Us</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit) => (
                <div 
                  key={benefit}
                  className="p-4 rounded-lg border border-border bg-card text-center"
                >
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="text-2xl font-semibold text-center mb-8">Open Positions</h2>
            <div className="space-y-4">
              {openPositions.map((position) => (
                <div 
                  key={position.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{position.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button>Apply Now</Button>
                </div>
              ))}
            </div>
          </section>

          {/* No Positions CTA */}
          <div className="text-center mt-12 p-8 rounded-2xl bg-muted/30">
            <h3 className="text-xl font-semibold mb-2">Don't see the right role?</h3>
            <p className="text-muted-foreground mb-4">
              We're always looking for talented people. Send us your resume and we'll keep you in mind.
            </p>
            <Button variant="outline" asChild>
              <a href={`mailto:${settings.supportEmail}?subject=General Application`}>
                Send General Application
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
