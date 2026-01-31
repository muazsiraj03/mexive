import { useState } from "react";
import { Plus, Pencil, Trash2, Star, GripVertical, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminHeader } from "./AdminHeader";
import { useTestimonials, Testimonial, TestimonialInput } from "@/hooks/use-testimonials";

const TOOLS = ["Metadata Generator", "Image to Prompt", "File Reviewer"];

const emptyTestimonial: Partial<TestimonialInput> = {
  name: "",
  role: "",
  avatar_url: "",
  rating: 5,
  content: "",
  tool: "Metadata Generator",
  is_active: true,
  sort_order: 0,
};

export function AdminTestimonials() {
  const {
    testimonials,
    isLoading,
    isSaving,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
  } = useTestimonials(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<Partial<TestimonialInput>>(emptyTestimonial);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingTestimonial(null);
    setFormData({ ...emptyTestimonial, sort_order: testimonials.length + 1 });
    setShowDialog(true);
  };

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      avatar_url: testimonial.avatar_url || "",
      rating: testimonial.rating,
      content: testimonial.content,
      tool: testimonial.tool,
      is_active: testimonial.is_active,
      sort_order: testimonial.sort_order,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) return;

    let success: boolean;
    if (editingTestimonial) {
      success = await updateTestimonial(editingTestimonial.id, formData);
    } else {
      success = await addTestimonial(formData);
    }

    if (success) {
      setShowDialog(false);
      setEditingTestimonial(null);
      setFormData(emptyTestimonial);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTestimonial(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    await updateTestimonial(testimonial.id, { is_active: !testimonial.is_active });
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader
          title="Testimonials"
          description="Manage customer reviews and testimonials"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Testimonials"
        description="Manage customer reviews and testimonials"
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""} •{" "}
                {testimonials.filter((t) => t.is_active).length} active
              </p>
            </div>
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </div>

          {/* Testimonials List */}
          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No testimonials yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first customer testimonial
                  </p>
                </CardContent>
              </Card>
            ) : (
              testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className={`transition-opacity ${
                    !testimonial.is_active ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-muted-foreground/50 cursor-grab">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{testimonial.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {testimonial.tool}
                          </Badge>
                          {!testimonial.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {testimonial.role}
                        </p>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-warning text-warning"
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {testimonial.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(testimonial)}
                          title={testimonial.is_active ? "Hide" : "Show"}
                        >
                          {testimonial.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(testimonial)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={formData.role || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Stock Photographer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select
                  value={formData.tool}
                  onValueChange={(v) => setFormData({ ...formData, tool: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOLS.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select
                  value={String(formData.rating || 5)}
                  onValueChange={(v) =>
                    setFormData({ ...formData, rating: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r} Star{r !== 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar URL (optional)</Label>
              <Input
                value={formData.avatar_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Testimonial Content *</Label>
              <Textarea
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write the customer testimonial here..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Show on website</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.content}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTestimonial ? "Save Changes" : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
