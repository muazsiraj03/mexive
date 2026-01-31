import { useState } from "react";
import { useFeatures, Feature } from "@/hooks/use-features";
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
  "Wand2", "MessageSquareText", "FileCheck", "Layers", "Files", "Download",
  "Coins", "Zap", "Shield", "Clock", "Sparkles", "Image", "Upload", "Settings",
  "BarChart", "Globe", "Lock", "Star", "Heart", "Check", "Tags", "Palette",
  "AlertCircle", "CheckCircle", "Target", "Cpu", "FileText", "Search",
];

export function AdminFeatures() {
  const { features, isLoading, createFeature, updateFeature, deleteFeature } = useFeatures();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [activeTab, setActiveTab] = useState("metadata-generator");
  const [formData, setFormData] = useState({
    tool: "metadata-generator",
    icon: "Wand2",
    title: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    const toolFeatures = features.filter((f) => f.tool === activeTab);
    setFormData({
      tool: activeTab,
      icon: "Wand2",
      title: "",
      description: "",
      sort_order: toolFeatures.length,
      is_active: true,
    });
    setEditingFeature(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      tool: feature.tool,
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
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <AdminHeader
          title="Features"
          description="Manage tool-specific features shown on the landing page"
        />
        <div className="animate-pulse space-y-4 max-w-6xl">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <AdminHeader
        title="Features"
        description="Manage tool-specific features shown on the landing page"
      />

      <div className="max-w-6xl space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
          Add Feature
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
          const toolFeatures = features
            .filter((f) => f.tool === tool.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <TabsContent key={tool.id} value={tool.id} className="space-y-4">
              {toolFeatures.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No features for {tool.label} yet. Add your first feature.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {toolFeatures.map((feature) => (
                    <Card key={feature.id} className={!feature.is_active ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                              {renderIcon(feature.icon)}
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {feature.title}
                                <Badge variant="outline" className="text-xs">
                                  #{feature.sort_order}
                                </Badge>
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={feature.is_active}
                              onCheckedChange={() => handleToggleActive(feature)}
                            />
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
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
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
              {editingFeature ? "Edit Feature" : "Add Feature"}
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
    </div>
  );
}
