import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useBlogPost, useBlogPosts } from "@/hooks/use-blog-posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || "");
  const { data: allPosts } = useBlogPosts(true);

  // Get related posts (same category, excluding current)
  const relatedPosts = allPosts
    ?.filter((p) => p.slug !== slug && p.category === post?.category)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container max-w-4xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-8" />
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container max-w-4xl text-center">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Simple markdown-like rendering (bold, italic, headers, paragraphs, links)
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p key={elements.length} className="mb-4 text-muted-foreground leading-relaxed">
            {formatInlineText(text)}
          </p>
        );
        currentParagraph = [];
      }
    };

    const formatInlineText = (text: string) => {
      // Handle bold **text**
      const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed === "") {
        flushParagraph();
        return;
      }

      if (trimmed.startsWith("# ")) {
        flushParagraph();
        elements.push(
          <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
            {trimmed.slice(2)}
          </h2>
        );
      } else if (trimmed.startsWith("## ")) {
        flushParagraph();
        elements.push(
          <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
            {trimmed.slice(3)}
          </h3>
        );
      } else if (trimmed.startsWith("### ")) {
        flushParagraph();
        elements.push(
          <h4 key={index} className="text-lg font-medium mt-4 mb-2">
            {trimmed.slice(4)}
          </h4>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        flushParagraph();
        elements.push(
          <li key={index} className="ml-6 mb-2 text-muted-foreground list-disc">
            {formatInlineText(trimmed.slice(2))}
          </li>
        );
      } else if (trimmed.startsWith("> ")) {
        flushParagraph();
        elements.push(
          <blockquote
            key={index}
            className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground"
          >
            {formatInlineText(trimmed.slice(2))}
          </blockquote>
        );
      } else {
        currentParagraph.push(trimmed);
      }
    });

    flushParagraph();
    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <article className="container max-w-4xl">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {post.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </div>
              {post.published_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">{renderContent(post.content)}</div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="container max-w-4xl mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group"
                >
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <Badge variant="secondary" className="mb-2">
                      {relatedPost.category}
                    </Badge>
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
