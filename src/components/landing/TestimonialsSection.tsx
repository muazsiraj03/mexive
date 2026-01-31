import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { useTestimonials, useLandingStats, Testimonial } from "@/hooks/use-testimonials";
import { Skeleton } from "@/components/ui/skeleton";

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="bg-card border-border/60 card-elevated hover:card-elevated-lg transition-smooth-300 h-full">
      <CardContent className="p-6 flex flex-col h-full min-h-[280px]">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-warning text-warning" />
          ))}
        </div>

        <div className="relative mb-6 flex-1">
          <Quote className="absolute -top-1 -left-1 w-6 h-6 text-secondary/20" />
          <p className="text-muted-foreground leading-relaxed pl-5">
            {testimonial.content}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border/40">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={testimonial.avatar_url || undefined}
              alt={testimonial.name}
            />
            <AvatarFallback className="bg-secondary/10 text-secondary font-medium">
              {testimonial.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {testimonial.name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {testimonial.role}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary whitespace-nowrap">
            {testimonial.tool}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialSkeleton() {
  return (
    <Card className="bg-card border-border/60 h-full">
      <CardContent className="p-6 flex flex-col h-full min-h-[280px]">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-4 h-4" />
          ))}
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-border/40">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-card border border-border/60">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-10 w-20 mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { testimonials, isLoading: isLoadingTestimonials } = useTestimonials();
  const { stats, isLoading: isLoadingStats } = useLandingStats();
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  // Filter to only show active testimonials
  const activeTestimonials = testimonials.filter((t) => t.is_active);
  const activeStats = stats.filter((s) => s.is_active);

  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Trusted by Creators
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Stock Contributors Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of photographers, illustrators, and digital artists
            who have streamlined their workflow with MetaGen.
          </p>
        </div>

        <div className="px-12">
          {isLoadingTestimonials ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <TestimonialSkeleton key={i} />
              ))}
            </div>
          ) : activeTestimonials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No testimonials available
            </div>
          ) : (
            <Carousel
              plugins={[plugin.current]}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent className="-ml-4">
                {activeTestimonials.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <TestimonialCard testimonial={testimonial} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 bg-card border-border/60 hover:bg-muted" />
              <CarouselNext className="hidden md:flex -right-12 bg-card border-border/60 hover:bg-muted" />
            </Carousel>
          )}
        </div>

        {/* Stats bar */}
        {isLoadingStats ? (
          <StatsSkeleton />
        ) : activeStats.length > 0 ? (
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-card border border-border/60 card-elevated">
            {activeStats.map((stat) => (
              <div key={stat.id} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
