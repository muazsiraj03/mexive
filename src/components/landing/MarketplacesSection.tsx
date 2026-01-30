import adobeStockLogo from "@/assets/adobe-stock-logo.png";
import freepikLogo from "@/assets/freepik-logo.png";
import shutterstockLogo from "@/assets/shutterstock-logo.png";

export function MarketplacesSection() {
  return (
    <section className="py-10 md:py-14 bg-card/50 border-y border-border/40">
      <div className="container">
        <p className="text-center text-sm text-muted-foreground mb-8 font-medium">
          Built specifically for real marketplace rules and review systems
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {/* Adobe Stock */}
          <div className="opacity-60 hover:opacity-100 transition-smooth-300">
            <img 
              src={adobeStockLogo} 
              alt="Adobe Stock" 
              className="h-4 md:h-5 w-auto object-contain"
            />
          </div>

          {/* Freepik */}
          <div className="opacity-60 hover:opacity-100 transition-smooth-300">
            <img 
              src={freepikLogo} 
              alt="Freepik" 
              className="h-4 md:h-5 w-auto object-contain"
            />
          </div>

          {/* Shutterstock */}
          <div className="opacity-60 hover:opacity-100 transition-smooth-300">
            <img 
              src={shutterstockLogo} 
              alt="Shutterstock" 
              className="h-4 md:h-5 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
