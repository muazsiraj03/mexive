import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";

const Privacy = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 31, 2026</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to {settings.appName}. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Profile information you choose to provide</li>
                <li>Images and files you upload for processing</li>
                <li>Payment information for subscriptions</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>To provide and maintain our services</li>
                <li>To process your transactions</li>
                <li>To send you technical notices and support messages</li>
                <li>To improve our AI models and services</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your data. Your uploaded images are processed 
                securely and are automatically deleted after processing unless you choose to save them to your history.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal data. We may share data with third-party service providers who help us 
                operate our platform (payment processors, cloud hosting, AI services) under strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default Privacy;
