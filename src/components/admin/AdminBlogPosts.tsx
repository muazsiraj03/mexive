import { useNavigate } from "react-router-dom";
import {
  useBlogPosts,
  useUpdateBlogPost,
  useDeleteBlogPost,
  BlogPost,
} from "@/hooks/use-blog-posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AdminHeader } from "./AdminHeader";

export function AdminBlogPosts() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts(false);
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const handleTogglePublish = async (post: BlogPost) => {
    await updatePost.mutateAsync({
      id: post.id,
      is_published: !post.is_published,
      published_at: !post.is_published ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Blog Posts" description="Manage your blog articles and content" />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Blog Posts" description="Manage your blog articles and content" />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => navigate("/admin/blog-posts/new")}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No blog posts yet. Create your first post!
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">/{post.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.is_published ? "default" : "outline"}>
                      {post.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.published_at
                      ? format(new Date(post.published_at), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(post)}
                        title={post.is_published ? "Unpublish" : "Publish"}
                      >
                        {post.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/blog-posts/${post.slug}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{post.title}"? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePost.mutate(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </div>
      </main>
    </>
  );
}
