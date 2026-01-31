import { useState } from "react";
import { useHowItWorks, HowItWorksStep } from "@/hooks/use-how-it-works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { AdminHeader } from "./AdminHeader";

const TOOLS = [
  { id: "metadata-generator", label: "Metadata Generator" },
  { id: "image-to-prompt", label: "Image to Prompt" },
  { id: "file-reviewer", label: "File Reviewer" },
];

const ICON_OPTIONS = [
  "Upload", "Cpu", "FileCheck", "ImagePlus", "Sparkles", "Copy", 
  "FileUp", "Search", "ClipboardCheck", "Wand2", "Download", 
  "Settings", "Zap", "Target", "CheckCircle", "ArrowRight",
  "Image", "FileText", "Tag", "Globe", "Layers", "Send"
];

interface StepFormData {
  tool: string;
  step_number: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const defaultFormData: StepFormData = {
  tool: "metadata-generator",
  step_number: "01",
  icon: "Upload",
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

export function AdminHowItWorks() {
  const { steps, loading, addStep, updateStep, deleteStep } = useHowItWorks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<HowItWorksStep | null>(null);
  const [formData, setFormData] = useState<StepFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState("metadata-generator");

  const handleOpenDialog = (step?: HowItWorksStep) => {
    if (step) {
      setEditingStep(step);
      setFormData({
        tool: step.tool,
        step_number: step.step_number,
        icon: step.icon,
        title: step.title,
        description: step.description,
        sort_order: step.sort_order,
        is_active: step.is_active,
      });
    } else {
      setEditingStep(null);
      const toolSteps = steps.filter(s => s.tool === activeTab);
      const nextOrder = toolSteps.length > 0 ? Math.max(...toolSteps.map(s => s.sort_order)) + 1 : 0;
      const nextNumber = String(toolSteps.length + 1).padStart(2, "0");
      setFormData({ 
        ...defaultFormData, 
        tool: activeTab, 
        sort_order: nextOrder,
        step_number: nextNumber
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) return;
    
    if (editingStep) {
      await updateStep(editingStep.id, formData);
    } else {
      await addStep(formData);
    }
    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingStep(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      await deleteStep(id);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = icons[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="How It Works" description="Manage the steps shown for each tool" />
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
      <AdminHeader title="How It Works" description="Manage the steps shown for each tool" />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingStep ? "Edit Step" : "Add Step"}</DialogTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Step Number</Label>
                  <Input
                    value={formData.step_number}
                    onChange={(e) => setFormData({ ...formData, step_number: e.target.value })}
                    placeholder="01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(icon)}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Step title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Step description"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingStep ? "Update Step" : "Add Step"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          const toolSteps = steps
            .filter((s) => s.tool === tool.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <TabsContent key={tool.id} value={tool.id} className="space-y-4">
              {toolSteps.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No steps yet. Add your first step for {tool.label}.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {toolSteps.map((step) => (
                    <Card key={step.id} className={!step.is_active ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                              {getIconComponent(step.icon)}
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Badge variant="outline">{step.step_number}</Badge>
                                {step.title}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={step.is_active ? "default" : "secondary"}>
                              {step.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(step)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(step.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
        </div>
      </main>
    </>
  );
}
