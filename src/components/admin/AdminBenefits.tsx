import { useState } from "react";
import { useBenefits, Benefit } from "@/hooks/use-benefits";
import { AdminHeader } from "./AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

const AVAILABLE_ICONS = [
  "Clock", "CheckCircle", "Search", "Shield", "User", "Globe", "Zap",
  "Sparkles", "Palette", "Layers", "Copy", "Target", "FileCheck",
  "AlertCircle", "TrendingUp", "Star", "Heart", "ThumbsUp", "Award",
  "Rocket", "Lightbulb", "Eye", "Lock", "Coins", "BarChart",
];

export function AdminBenefits() {
  const { benefits, isLoading, createBenefit, updateBenefit, deleteBenefit } = useBenefits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [activeTab, setActiveTab] = useState("metadata-generator");
  const [formData, setFormData] = useState({
    tool: "metadata-generator",
    icon: "CheckCircle",
    title: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    const toolBenefits = benefits.filter((b) => b.tool === activeTab);
    setFormData({
      tool: activeTab,
      icon: "CheckCircle",
      title: "",
      description: "",
      sort_order: toolBenefits.length,
      is_active: true,
    });
    setEditingBenefit(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setFormData({
      tool: benefit.tool,
      icon: benefit.icon,
      title: benefit.title,
      description: benefit.description,
      sort_order: benefit.sort_order,
      is_active: benefit.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return;

    if (editingBenefit) {
      await updateBenefit.mutateAsync({ id: editingBenefit.id, ...formData });
    } else {
      await createBenefit.mutateAsync(formData);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this benefit?")) {
      await deleteBenefit.mutateAsync(id);
    }
  };

  const handleToggleActive = async (benefit: Benefit) => {
    await updateBenefit.mutateAsync({ id: benefit.id, is_active: !benefit.is_active });
  };

  const renderIcon = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Benefits"
        description="Manage tool-specific benefits shown on the landing page"
      />

      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
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

        {TOOLS.map((tool) => {
          const toolBenefits = benefits
            .filter((b) => b.tool === tool.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <TabsContent key={tool.id} value={tool.id} className="space-y-4">
              {toolBenefits.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No benefits for {tool.label} yet. Add your first benefit.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {toolBenefits.map((benefit) => (
                    <Card key={benefit.id} className={!benefit.is_active ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                              {renderIcon(benefit.icon)}
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {benefit.title}
                                <Badge variant="outline" className="text-xs">
                                  #{benefit.sort_order}
                                </Badge>
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={benefit.is_active}
                              onCheckedChange={() => handleToggleActive(benefit)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(benefit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(benefit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBenefit ? "Edit Benefit" : "Add Benefit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tool</Label>
              <Select
                value={formData.tool}
                onValueChange={(value) => setFormData({ ...formData, tool: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOLS.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      {tool.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <SelectContent className="max-h-60">
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
                placeholder="Benefit title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Benefit description"
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
              {editingBenefit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
