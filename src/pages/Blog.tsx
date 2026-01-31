import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "10 Tips for Writing Better Stock Photo Metadata",
    excerpt: "Learn the secrets to creating metadata that gets your images discovered and downloaded more often.",
    date: "January 28, 2026",
    category: "Tips & Tricks",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "How AI is Transforming the Stock Photography Industry",
    excerpt: "Discover how artificial intelligence is revolutionizing workflows for stock contributors worldwide.",
    date: "January 20, 2026",
    category: "Industry News",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Maximizing Your Earnings Across Multiple Stock Platforms",
    excerpt: "A comprehensive guide to distributing your work across Shutterstock, Adobe Stock, and more.",
    date: "January 15, 2026",
    category: "Strategy",
    readTime: "8 min read",
  },
  {
    id: 4,
    title: "The Complete Guide to Keyword Optimization for Stock Images",
    excerpt: "Everything you need to know about choosing the right keywords to boost your image visibility.",
    date: "January 10, 2026",
    category: "SEO",
    readTime: "6 min read",
  },
];

const Blog = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Tips, insights, and news for stock contributors
            </p>
          </div>

          <div className="grid gap-8">
            {blogPosts.map((post) => (
              <article 
                key={post.id}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {post.category}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {post.date}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </div>
                  <Button variant="ghost" className="self-start md:self-center">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              More articles coming soon! Subscribe to stay updated.
            </p>
            <Button variant="outline" asChild>
              <Link to="/contact">Get Notified</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
