import { useState } from "react";
import { Plus, Pencil, Trash2, HelpCircle, GripVertical, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { useFAQs, FAQ, FAQInput } from "@/hooks/use-faqs";

const emptyFAQ: Partial<FAQInput> = {
  question: "",
  answer: "",
  is_active: true,
  sort_order: 0,
};

export function AdminFAQs() {
  const {
    faqs,
    isLoading,
    isSaving,
    addFAQ,
    updateFAQ,
    deleteFAQ,
  } = useFAQs(true);

  const [showDialog, setShowDialog] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<Partial<FAQInput>>(emptyFAQ);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingFAQ(null);
    setFormData({ ...emptyFAQ, sort_order: faqs.length + 1 });
    setShowDialog(true);
  };

  const handleOpenEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      is_active: faq.is_active,
      sort_order: faq.sort_order,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer) return;

    let success: boolean;
    if (editingFAQ) {
      success = await updateFAQ(editingFAQ.id, formData);
    } else {
      success = await addFAQ(formData);
    }

    if (success) {
      setShowDialog(false);
      setEditingFAQ(null);
      setFormData(emptyFAQ);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFAQ(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (faq: FAQ) => {
    await updateFAQ(faq.id, { is_active: !faq.is_active });
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader
          title="FAQs"
          description="Manage frequently asked questions"
        />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="FAQs"
        description="Manage frequently asked questions"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} •{" "}
                {faqs.filter((f) => f.is_active).length} active
              </p>
            </div>
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add FAQ
            </Button>
          </div>

          {/* FAQs List */}
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No FAQs yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first frequently asked question
                  </p>
                </CardContent>
              </Card>
            ) : (
              faqs.map((faq, index) => (
                <Card
                  key={faq.id}
                  className={`transition-opacity ${!faq.is_active ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-muted-foreground/50 cursor-grab">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary/10 text-secondary text-xs font-medium shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium line-clamp-1">{faq.question}</h3>
                          {!faq.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(faq)}
                          title={faq.is_active ? "Hide" : "Show"}
                        >
                          {faq.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(faq)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(faq.id)}
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
              {editingFAQ ? "Edit FAQ" : "Add FAQ"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question *</Label>
              <Input
                value={formData.question || ""}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="What is your question?"
              />
            </div>

            <div className="space-y-2">
              <Label>Answer *</Label>
              <Textarea
                value={formData.answer || ""}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Write the answer here..."
                rows={5}
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
              disabled={isSaving || !formData.question || !formData.answer}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingFAQ ? "Save Changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
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
