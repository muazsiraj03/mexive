import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { useBlogPosts } from "@/hooks/use-blog-posts";
import { format } from "date-fns";

const Blog = () => {
  const { data: posts, isLoading } = useBlogPosts(true);

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

          {isLoading ? (
            <div className="grid gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-xl border border-border bg-card">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <Skeleton className="h-7 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-10 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                No blog posts yet. Check back soon!
              </p>
              <Button variant="outline" asChild>
                <Link to="/contact">Get Notified</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-8">
              {posts?.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <article className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary">{post.category}</Badge>
                          {post.published_at && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(post.published_at), "MMMM d, yyyy")}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.read_time_minutes} min read
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-muted-foreground">{post.excerpt}</p>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        className="self-start md:self-center"
                        tabIndex={-1}
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Want to stay updated? Subscribe to our newsletter.
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
