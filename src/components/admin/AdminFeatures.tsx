import { useState } from "react";
import { useFeatures, Feature } from "@/hooks/use-features";
import { AdminHeader } from "./AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

const AVAILABLE_ICONS = [
  "Wand2",
  "MessageSquareText",
  "FileCheck",
  "Layers",
  "Files",
  "Download",
  "Coins",
  "Zap",
  "Shield",
  "Clock",
  "Sparkles",
  "Image",
  "Upload",
  "Settings",
  "BarChart",
  "Globe",
  "Lock",
  "Star",
  "Heart",
  "Check",
];

export function AdminFeatures() {
  const { features, isLoading, createFeature, updateFeature, deleteFeature } = useFeatures();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({
    icon: "Wand2",
    title: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      icon: "Wand2",
      title: "",
      description: "",
      sort_order: features.length,
      is_active: true,
    });
    setEditingFeature(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, sort_order: features.length }));
    setDialogOpen(true);
  };

  const openEditDialog = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      icon: feature.icon,
      title: feature.title,
      description: feature.description,
      sort_order: feature.sort_order,
      is_active: feature.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return;

    if (editingFeature) {
      await updateFeature.mutateAsync({ id: editingFeature.id, ...formData });
    } else {
      await createFeature.mutateAsync(formData);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this feature?")) {
      await deleteFeature.mutateAsync(id);
    }
  };

  const handleToggleActive = async (feature: Feature) => {
    await updateFeature.mutateAsync({ id: feature.id, is_active: !feature.is_active });
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Features"
        description="Manage landing page features section"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Features</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Feature
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : features.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No features yet. Add your first feature.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-20">Active</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell>{feature.sort_order}</TableCell>
                    <TableCell>{renderIcon(feature.icon)}</TableCell>
                    <TableCell className="font-medium">{feature.title}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {feature.description}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={feature.is_active}
                        onCheckedChange={() => handleToggleActive(feature)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(feature)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(feature.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? "Edit Feature" : "Add Feature"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(formData.icon)}
                      <span>{formData.icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Feature title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Feature description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim() || !formData.description.trim()}>
              {editingFeature ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
