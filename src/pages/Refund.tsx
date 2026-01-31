import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";

const Refund = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 31, 2026</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Subscription Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with our service, 
                you can request a full refund within 7 days of your initial purchase, provided you haven't consumed 
                more than 20% of your allocated credits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Credit Pack Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Credit pack purchases are generally non-refundable once credits have been added to your account. 
                However, we may consider refund requests on a case-by-case basis for unused credits within 48 hours 
                of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Service Issues</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you experience technical issues that prevent you from using our services, we will either:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Restore consumed credits for failed generations</li>
                <li>Provide a prorated refund for extended service outages</li>
                <li>Extend your subscription period to compensate for downtime</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">To request a refund:</p>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                <li>Email us at {settings.supportEmail} with your account email</li>
                <li>Include your reason for requesting a refund</li>
                <li>Provide your transaction ID or payment reference</li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We aim to process all refund requests within 5-7 business days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Exceptions</h2>
              <p className="text-muted-foreground leading-relaxed">Refunds will not be provided for:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Accounts terminated due to Terms of Service violations</li>
                <li>Subscriptions cancelled after the 7-day guarantee period</li>
                <li>Credits that have already been consumed</li>
                <li>Promotional or discounted purchases (unless otherwise stated)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For any questions about our refund policy, please contact{" "}
                <a href={`mailto:${settings.supportEmail}`} className="text-primary hover:underline">
                  {settings.supportEmail}
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
