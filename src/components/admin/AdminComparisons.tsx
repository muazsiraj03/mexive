import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useComparisons, Comparison } from "@/hooks/use-comparisons";
import { AdminHeader } from "./AdminHeader";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

export function AdminComparisons() {
  const { comparisons, isLoading, createComparison, updateComparison, deleteComparison } = useComparisons();
  const [activeTab, setActiveTab] = useState("metadata-generator");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComparison, setEditingComparison] = useState<Comparison | null>(null);
  const [formData, setFormData] = useState({
    tool: "metadata-generator",
    aspect: "",
    manual_value: "",
    ai_value: "",
    sort_order: 0,
    is_active: true,
  });

  const filteredComparisons = comparisons.filter((c) => c.tool === activeTab);

  const resetForm = () => {
    setFormData({
      tool: activeTab,
      aspect: "",
      manual_value: "",
      ai_value: "",
      sort_order: 0,
      is_active: true,
    });
    setEditingComparison(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      tool: activeTab,
      sort_order: filteredComparisons.length,
    }));
    setIsDialogOpen(true);
  };

  const openEditDialog = (comparison: Comparison) => {
    setEditingComparison(comparison);
    setFormData({
      tool: comparison.tool,
      aspect: comparison.aspect,
      manual_value: comparison.manual_value,
      ai_value: comparison.ai_value,
      sort_order: comparison.sort_order,
      is_active: comparison.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingComparison) {
      await updateComparison.mutateAsync({
        id: editingComparison.id,
        ...formData,
      });
    } else {
      await createComparison.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteComparison.mutateAsync(id);
  };

  const toggleActive = async (comparison: Comparison) => {
    await updateComparison.mutateAsync({
      id: comparison.id,
      is_active: !comparison.is_active,
    });
  };

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Comparison Section" description="Manage the Manual vs AI comparison table for each tool" />
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
      <AdminHeader title="Comparison Section" description="Manage the Manual vs AI comparison table for each tool" />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl space-y-6">
          <div className="flex justify-end">
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Comparison
            </Button>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {TOOLS.map((tool) => (
            <TabsTrigger key={tool.id} value={tool.id}>
              {tool.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TOOLS.map((tool) => (
          <TabsContent key={tool.id} value={tool.id}>
            <Card>
              <CardHeader>
                <CardTitle>{tool.label} Comparisons</CardTitle>
                <CardDescription>
                  Comparison items for the {tool.label} tool
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredComparisons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comparison items for {tool.label} yet. Add your first one!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Aspect</TableHead>
                        <TableHead>Manual Workflow</TableHead>
                        <TableHead>AI-Powered</TableHead>
                        <TableHead className="w-20">Order</TableHead>
                        <TableHead className="w-20">Active</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComparisons.map((comparison) => (
                        <TableRow key={comparison.id} className={!comparison.is_active ? "opacity-50" : ""}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-medium">{comparison.aspect}</TableCell>
                          <TableCell className="text-muted-foreground">{comparison.manual_value}</TableCell>
                          <TableCell className="text-foreground">{comparison.ai_value}</TableCell>
                          <TableCell>{comparison.sort_order}</TableCell>
                          <TableCell>
                            <Switch
                              checked={comparison.is_active}
                              onCheckedChange={() => toggleActive(comparison)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(comparison)}>
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
                                    <AlertDialogTitle>Delete Comparison</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{comparison.aspect}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(comparison.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingComparison ? "Edit Comparison" : "Add Comparison"}</DialogTitle>
            <DialogDescription>
              {editingComparison ? "Update the comparison item details" : "Add a new comparison row to the table"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aspect">Aspect</Label>
              <Input
                id="aspect"
                value={formData.aspect}
                onChange={(e) => setFormData({ ...formData, aspect: e.target.value })}
                placeholder="e.g., Time per 10 images"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual_value">Manual Workflow Value</Label>
              <Input
                id="manual_value"
                value={formData.manual_value}
                onChange={(e) => setFormData({ ...formData, manual_value: e.target.value })}
                placeholder="e.g., 30–60 minutes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai_value">AI-Powered Value</Label>
              <Input
                id="ai_value"
                value={formData.ai_value}
                onChange={(e) => setFormData({ ...formData, ai_value: e.target.value })}
                placeholder="e.g., Under 2 minutes"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.aspect || !formData.manual_value || !formData.ai_value}
            >
              {editingComparison ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </>
  );
}
