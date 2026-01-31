import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";

const Cookies = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 31, 2026</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They help us provide 
                you with a better experience by remembering your preferences and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium mb-2 mt-6">Essential Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Required for the website to function properly. These include authentication cookies that keep you 
                logged in and security cookies that protect against fraud.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-6">Functional Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Remember your preferences such as theme settings, language, and other customizations to provide 
                a personalized experience.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-6">Analytics Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Help us understand how visitors interact with our website. We use this data to improve our services 
                and user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services that set their own cookies, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Payment processors for secure transactions</li>
                <li>Analytics providers to understand usage patterns</li>
                <li>Authentication services for secure login</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>View what cookies are stored</li>
                <li>Delete individual or all cookies</li>
                <li>Block cookies from specific or all websites</li>
                <li>Set preferences for certain types of cookies</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Note: Blocking essential cookies may prevent some features from working properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Changes will be posted on this page with 
                an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about our use of cookies? Contact us at{" "}
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

export default Cookies;
