import { useState } from "react";
import { Plus, Pencil, Trash2, Star, GripVertical, Eye, EyeOff, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  useTestimonials, 
  useLandingStats, 
  Testimonial, 
  TestimonialInput,
  LandingStat,
  LandingStatInput 
} from "@/hooks/use-testimonials";

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

const emptyStat: Partial<LandingStatInput> = {
  label: "",
  value: "",
  is_active: true,
  sort_order: 0,
};

export function AdminTestimonials() {
  const {
    testimonials,
    isLoading: isLoadingTestimonials,
    isSaving: isSavingTestimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
  } = useTestimonials(true);

  const {
    stats,
    isLoading: isLoadingStats,
    isSaving: isSavingStats,
    addStat,
    updateStat,
    deleteStat,
  } = useLandingStats(true);

  // Testimonial state
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialFormData, setTestimonialFormData] = useState<Partial<TestimonialInput>>(emptyTestimonial);
  const [deleteTestimonialId, setDeleteTestimonialId] = useState<string | null>(null);

  // Stat state
  const [showStatDialog, setShowStatDialog] = useState(false);
  const [editingStat, setEditingStat] = useState<LandingStat | null>(null);
  const [statFormData, setStatFormData] = useState<Partial<LandingStatInput>>(emptyStat);
  const [deleteStatId, setDeleteStatId] = useState<string | null>(null);

  // Testimonial handlers
  const handleOpenAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialFormData({ ...emptyTestimonial, sort_order: testimonials.length + 1 });
    setShowTestimonialDialog(true);
  };

  const handleOpenEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialFormData({
      name: testimonial.name,
      role: testimonial.role,
      avatar_url: testimonial.avatar_url || "",
      rating: testimonial.rating,
      content: testimonial.content,
      tool: testimonial.tool,
      is_active: testimonial.is_active,
      sort_order: testimonial.sort_order,
    });
    setShowTestimonialDialog(true);
  };

  const handleSaveTestimonial = async () => {
    if (!testimonialFormData.name || !testimonialFormData.content) return;

    let success: boolean;
    if (editingTestimonial) {
      success = await updateTestimonial(editingTestimonial.id, testimonialFormData);
    } else {
      success = await addTestimonial(testimonialFormData);
    }

    if (success) {
      setShowTestimonialDialog(false);
      setEditingTestimonial(null);
      setTestimonialFormData(emptyTestimonial);
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!deleteTestimonialId) return;
    await deleteTestimonial(deleteTestimonialId);
    setDeleteTestimonialId(null);
  };

  const handleToggleTestimonialActive = async (testimonial: Testimonial) => {
    await updateTestimonial(testimonial.id, { is_active: !testimonial.is_active });
  };

  // Stat handlers
  const handleOpenAddStat = () => {
    setEditingStat(null);
    setStatFormData({ ...emptyStat, sort_order: stats.length + 1 });
    setShowStatDialog(true);
  };

  const handleOpenEditStat = (stat: LandingStat) => {
    setEditingStat(stat);
    setStatFormData({
      label: stat.label,
      value: stat.value,
      is_active: stat.is_active,
      sort_order: stat.sort_order,
    });
    setShowStatDialog(true);
  };

  const handleSaveStat = async () => {
    if (!statFormData.label || !statFormData.value) return;

    let success: boolean;
    if (editingStat) {
      success = await updateStat(editingStat.id, statFormData);
    } else {
      success = await addStat(statFormData);
    }

    if (success) {
      setShowStatDialog(false);
      setEditingStat(null);
      setStatFormData(emptyStat);
    }
  };

  const handleDeleteStat = async () => {
    if (!deleteStatId) return;
    await deleteStat(deleteStatId);
    setDeleteStatId(null);
  };

  const handleToggleStatActive = async (stat: LandingStat) => {
    await updateStat(stat.id, { is_active: !stat.is_active });
  };

  const isLoading = isLoadingTestimonials || isLoadingStats;

  if (isLoading) {
    return (
      <>
        <AdminHeader
          title="Testimonials & Stats"
          description="Manage customer reviews and landing page statistics"
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
        title="Testimonials & Stats"
        description="Manage customer reviews and landing page statistics"
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Tabs defaultValue="testimonials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="testimonials" className="gap-2">
                <Star className="h-4 w-4" />
                Testimonials
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Stats Bar
              </TabsTrigger>
            </TabsList>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {testimonials.length} testimonial{testimonials.length !== 1 ? "s" : ""} •{" "}
                    {testimonials.filter((t) => t.is_active).length} active
                  </p>
                </div>
                <Button onClick={handleOpenAddTestimonial} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Testimonial
                </Button>
              </div>

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
                      className={`transition-opacity ${!testimonial.is_active ? "opacity-60" : ""}`}
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
                                <Star key={i} className="w-3 h-3 fill-warning text-warning" />
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
                              onClick={() => handleToggleTestimonialActive(testimonial)}
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
                              onClick={() => handleOpenEditTestimonial(testimonial)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTestimonialId(testimonial.id)}
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
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Stats Bar</CardTitle>
                      <CardDescription>
                        Manage the statistics shown below testimonials
                      </CardDescription>
                    </div>
                    <Button onClick={handleOpenAddStat} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Stat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No stats configured</p>
                      <p className="text-sm text-muted-foreground">
                        Add statistics to display on the landing page
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.map((stat) => (
                        <div
                          key={stat.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border bg-card transition-opacity ${
                            !stat.is_active ? "opacity-60" : ""
                          }`}
                        >
                          <div className="text-muted-foreground/50 cursor-grab">
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-secondary">
                                {stat.value}
                              </span>
                              <span className="text-muted-foreground">{stat.label}</span>
                              {!stat.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatActive(stat)}
                              title={stat.is_active ? "Hide" : "Show"}
                            >
                              {stat.is_active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditStat(stat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteStatId(stat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50">
                    {stats.filter(s => s.is_active).map((stat) => (
                      <div key={stat.id} className="text-center">
                        <p className="text-2xl font-bold text-secondary mb-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add/Edit Testimonial Dialog */}
      <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
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
                  value={testimonialFormData.name || ""}
                  onChange={(e) =>
                    setTestimonialFormData({ ...testimonialFormData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={testimonialFormData.role || ""}
                  onChange={(e) =>
                    setTestimonialFormData({ ...testimonialFormData, role: e.target.value })
                  }
                  placeholder="Stock Photographer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select
                  value={testimonialFormData.tool}
                  onValueChange={(v) => setTestimonialFormData({ ...testimonialFormData, tool: v })}
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
                  value={String(testimonialFormData.rating || 5)}
                  onValueChange={(v) =>
                    setTestimonialFormData({ ...testimonialFormData, rating: parseInt(v) })
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
                value={testimonialFormData.avatar_url || ""}
                onChange={(e) =>
                  setTestimonialFormData({ ...testimonialFormData, avatar_url: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Testimonial Content *</Label>
              <Textarea
                value={testimonialFormData.content || ""}
                onChange={(e) =>
                  setTestimonialFormData({ ...testimonialFormData, content: e.target.value })
                }
                placeholder="Write the customer testimonial here..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={testimonialFormData.is_active}
                onCheckedChange={(checked) =>
                  setTestimonialFormData({ ...testimonialFormData, is_active: checked })
                }
              />
              <Label>Show on website</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestimonialDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTestimonial}
              disabled={isSavingTestimonials || !testimonialFormData.name || !testimonialFormData.content}
            >
              {isSavingTestimonials && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTestimonial ? "Save Changes" : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Stat Dialog */}
      <Dialog open={showStatDialog} onOpenChange={setShowStatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStat ? "Edit Stat" : "Add Stat"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Value *</Label>
              <Input
                value={statFormData.value || ""}
                onChange={(e) =>
                  setStatFormData({ ...statFormData, value: e.target.value })
                }
                placeholder="e.g., 10K+, 95%, 4.9/5"
              />
              <p className="text-xs text-muted-foreground">
                The main statistic number (e.g., "10K+", "95%")
              </p>
            </div>

            <div className="space-y-2">
              <Label>Label *</Label>
              <Input
                value={statFormData.label || ""}
                onChange={(e) =>
                  setStatFormData({ ...statFormData, label: e.target.value })
                }
                placeholder="e.g., Active Users, Acceptance Rate"
              />
              <p className="text-xs text-muted-foreground">
                Description shown below the value
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={statFormData.is_active}
                onCheckedChange={(checked) =>
                  setStatFormData({ ...statFormData, is_active: checked })
                }
              />
              <Label>Show on website</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveStat}
              disabled={isSavingStats || !statFormData.label || !statFormData.value}
            >
              {isSavingStats && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingStat ? "Save Changes" : "Add Stat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Testimonial Confirmation */}
      <AlertDialog open={!!deleteTestimonialId} onOpenChange={() => setDeleteTestimonialId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTestimonial}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stat Confirmation */}
      <AlertDialog open={!!deleteStatId} onOpenChange={() => setDeleteStatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStat}
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
