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

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Stock Photographer",
    avatar: "",
    rating: 5,
    content:
      "MetaGen has completely transformed my workflow. I used to spend hours writing metadata for each image. Now I upload a batch and have perfect, marketplace-ready metadata in minutes.",
    tool: "Metadata Generator",
  },
  {
    name: "David Chen",
    role: "Digital Artist",
    avatar: "",
    rating: 5,
    content:
      "The Image to Prompt feature is incredible for recreating styles. I can analyze my best-selling images and understand exactly what prompts would recreate that success.",
    tool: "Image to Prompt",
  },
  {
    name: "Emma Rodriguez",
    role: "Product Photographer",
    avatar: "",
    rating: 5,
    content:
      "The File Reviewer has been a game-changer for my workflow. I catch issues before submission and my acceptance rate has improved dramatically.",
    tool: "File Reviewer",
  },
  {
    name: "Michael Park",
    role: "Stock Contributor",
    avatar: "",
    rating: 5,
    content:
      "I was getting so many rejections before using the File Reviewer. Now I catch issues before submission and my acceptance rate has gone from 60% to over 95%.",
    tool: "File Reviewer",
  },
  {
    name: "Lisa Thompson",
    role: "Freelance Illustrator",
    avatar: "",
    rating: 5,
    content:
      "Finally, a tool that understands stock marketplace requirements! The AI-generated keywords are spot-on and my images are getting discovered way more often.",
    tool: "Metadata Generator",
  },
  {
    name: "James Wilson",
    role: "Nature Photographer",
    avatar: "",
    rating: 5,
    content:
      "The multi-marketplace support is a game-changer. I submit to Adobe Stock, Shutterstock, and Freepik, and MetaGen formats everything correctly for each platform.",
    tool: "Metadata Generator",
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <Card className="bg-card border-border/60 card-elevated hover:card-elevated-lg transition-smooth-300 h-full">
      <CardContent className="p-6 flex flex-col h-full min-h-[280px]">
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 fill-warning text-warning"
            />
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
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
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

export function TestimonialsSection() {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

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
              {testimonials.map((testimonial) => (
                <CarouselItem 
                  key={testimonial.name} 
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-card border-border/60 hover:bg-muted" />
            <CarouselNext className="hidden md:flex -right-12 bg-card border-border/60 hover:bg-muted" />
          </Carousel>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-card border border-border/60 card-elevated">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">10K+</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">2M+</p>
            <p className="text-sm text-muted-foreground">Images Processed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">95%</p>
            <p className="text-sm text-muted-foreground">Acceptance Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-secondary mb-1">4.9/5</p>
            <p className="text-sm text-muted-foreground">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
