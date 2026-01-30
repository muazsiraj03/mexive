import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarketplacesSection } from "@/components/landing/MarketplacesSection";
import { ToolsShowcaseSection } from "@/components/landing/ToolsShowcaseSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { Footer } from "@/components/landing/Footer";
import { StickyCTA } from "@/components/landing/StickyCTA";
import { AnimatedSection } from "@/components/ui/animated-section";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        <AnimatedSection variant="fade-up">
          <MarketplacesSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <ToolsShowcaseSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <HowItWorksSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <BenefitsSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <FeaturesSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <ComparisonSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <PricingSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <TestimonialsSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <TrustSection />
        </AnimatedSection>
        
        <AnimatedSection variant="fade-up">
          <FAQSection />
        </AnimatedSection>
        
        <AnimatedSection variant="scale">
          <FinalCTASection />
        </AnimatedSection>
      </main>
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default Index;
