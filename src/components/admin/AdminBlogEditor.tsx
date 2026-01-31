import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  BlogPostInsert,
} from "@/hooks/use-blog-posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { BlogCoverUpload } from "./BlogCoverUpload";
import { BlogContentEditor } from "./BlogContentEditor";
import { toast } from "sonner";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const defaultPost: BlogPostInsert = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: null,
  author_name: "Mexive Team",
  category: "Tips & Tricks",
  tags: [],
  is_published: false,
  published_at: null,
  read_time_minutes: 5,
  sort_order: 0,
};

export function AdminBlogEditor() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const isEditing = slug && slug !== "new";

  const { data: existingPost, isLoading: isLoadingPost } = useBlogPost(isEditing ? slug : "");
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [formData, setFormData] = useState<BlogPostInsert>(defaultPost);
  const [tagsInput, setTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        excerpt: existingPost.excerpt,
        content: existingPost.content,
        cover_image_url: existingPost.cover_image_url,
        author_name: existingPost.author_name,
        category: existingPost.category,
        tags: existingPost.tags,
        is_published: existingPost.is_published,
        published_at: existingPost.published_at,
        read_time_minutes: existingPost.read_time_minutes,
        sort_order: existingPost.sort_order,
      });
      setTagsInput(existingPost.tags.join(", "));
    }
  }, [existingPost]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : generateSlug(title),
    }));
  };

  const handleSave = async (publish?: boolean) => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error("Excerpt is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSaving(true);
    try {
      const shouldPublish = publish !== undefined ? publish : formData.is_published;
      const postData: BlogPostInsert = {
        ...formData,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_published: shouldPublish,
        published_at: shouldPublish
          ? formData.published_at || new Date().toISOString()
          : null,
      };

      if (isEditing && existingPost) {
        await updatePost.mutateAsync({ id: existingPost.id, ...postData });
      } else {
        await createPost.mutateAsync(postData);
      }

      navigate("/admin/blog-posts");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/blog/${formData.slug}`, "_blank");
    }
  };

  if (isEditing && isLoadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/blog-posts")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Blog Post" : "New Blog Post"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Update your blog article"
                : "Create a new blog article"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && formData.is_published && (
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {formData.is_published ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter your blog post title..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                  placeholder="A brief summary of your article (shown in listings)..."
                  rows={3}
                />
              </div>

              <Separator />

              <BlogContentEditor
                value={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogCoverUpload
                value={formData.cover_image_url}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, cover_image_url: url }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Author</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      author_name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="SEO, Metadata, Tips"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="read_time">Read Time (minutes)</Label>
                <Input
                  id="read_time"
                  type="number"
                  min={1}
                  value={formData.read_time_minutes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      read_time_minutes: parseInt(e.target.value) || 5,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_published">Published</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this post visible to everyone
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_published: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
