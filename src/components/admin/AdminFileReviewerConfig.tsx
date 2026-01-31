import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Settings2, FileType, Building2, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useFileReviewerConfig, RejectionReason, MarketplaceRule } from "@/hooks/use-file-reviewer-config";
import { toast } from "sonner";

const FILE_TYPES = ["raster", "svg", "eps", "ai", "video"];
const CATEGORIES = ["visual_quality", "technical", "content", "commercial"];
const SEVERITIES = ["high", "medium", "low"] as const;

import { AdminHeader } from "./AdminHeader";

export function AdminFileReviewerConfig() {
  const {
    config,
    isLoading,
    isSaving,
    updateRejectionReason,
    addRejectionReason,
    deleteRejectionReason,
    updateMarketplaceRule,
    updateScoringWeights,
    updateThresholds,
  } = useFileReviewerConfig();

  const [activeFileType, setActiveFileType] = useState("raster");
  const [activeMarketplace, setActiveMarketplace] = useState("Adobe Stock");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newReason, setNewReason] = useState({
    code: "",
    message: "",
    severity: "medium" as const,
    category: "technical",
  });

  // Local state for weights and thresholds
  const [localWeights, setLocalWeights] = useState({
    visual_quality: 25,
    technical: 30,
    content: 25,
    commercial: 20,
  });
  const [localThresholds, setLocalThresholds] = useState({
    pass: 70,
    warning: 50,
  });

  useEffect(() => {
    if (config) {
      setLocalWeights(config.scoring_weights);
      setLocalThresholds({
        pass: config.pass_threshold,
        warning: config.warning_threshold,
      });
    }
  }, [config]);

  if (isLoading) {
    return (
      <>
        <AdminHeader 
          title="File Reviewer Config" 
          description="Configure AI file analysis rules and scoring" 
        />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  if (!config) {
    return (
      <>
        <AdminHeader 
          title="File Reviewer Config" 
          description="Configure AI file analysis rules and scoring" 
        />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No configuration found</p>
            <p className="text-sm text-muted-foreground">The file reviewer configuration is not set up.</p>
          </div>
        </main>
      </>
    );
  }

  const handleAddReason = async () => {
    if (!newReason.code || !newReason.message) {
      toast.error("Please fill in all fields");
      return;
    }

    const success = await addRejectionReason(activeFileType, newReason.code.toUpperCase().replace(/\s+/g, "_"), {
      message: newReason.message,
      severity: newReason.severity,
      category: newReason.category,
      enabled: true,
    });

    if (success) {
      setShowAddDialog(false);
      setNewReason({ code: "", message: "", severity: "medium", category: "technical" });
    }
  };

  const handleSaveWeights = async () => {
    // Validate weights sum to 100
    const total = Object.values(localWeights).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      toast.error(`Weights must sum to 100 (currently ${total})`);
      return;
    }
    await updateScoringWeights(localWeights);
  };

  const handleSaveThresholds = async () => {
    if (localThresholds.warning >= localThresholds.pass) {
      toast.error("Warning threshold must be lower than pass threshold");
      return;
    }
    await updateThresholds(localThresholds.pass, localThresholds.warning);
  };

  const currentReasons = config.rejection_reasons[activeFileType] || {};
  const currentMarketplace = config.marketplace_rules[activeMarketplace];
  const marketplaces = Object.keys(config.marketplace_rules);

  return (
    <>
      <AdminHeader 
        title="File Reviewer Config" 
        description="Configure AI file analysis rules and scoring" 
      />
      
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
        <Tabs defaultValue="reasons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reasons" className="gap-2">
            <FileType className="h-4 w-4" />
            Rejection Reasons
          </TabsTrigger>
          <TabsTrigger value="marketplaces" className="gap-2">
            <Building2 className="h-4 w-4" />
            Marketplace Rules
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Scale className="h-4 w-4" />
            Scoring
          </TabsTrigger>
        </TabsList>

        {/* Rejection Reasons Tab */}
        <TabsContent value="reasons" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rejection Reasons</CardTitle>
                  <CardDescription>Configure what issues the AI checks for each file type</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Reason
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Rejection Reason</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Code (identifier)</Label>
                        <Input
                          placeholder="e.g., POOR_LIGHTING"
                          value={newReason.code}
                          onChange={(e) => setNewReason({ ...newReason, code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Input
                          placeholder="e.g., Image has poor lighting"
                          value={newReason.message}
                          onChange={(e) => setNewReason({ ...newReason, message: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Select
                            value={newReason.severity}
                            onValueChange={(v) => setNewReason({ ...newReason, severity: v as typeof newReason.severity })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SEVERITIES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newReason.category}
                            onValueChange={(v) => setNewReason({ ...newReason, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddReason} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Add Reason
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeFileType} onValueChange={setActiveFileType}>
                <TabsList className="mb-4">
                  {FILE_TYPES.map((type) => (
                    <TabsTrigger key={type} value={type} className="capitalize">
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {Object.entries(currentReasons).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No rejection reasons configured for this file type
                      </p>
                    ) : (
                      Object.entries(currentReasons).map(([code, reason]) => (
                        <div
                          key={code}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <Switch
                            checked={reason.enabled}
                            onCheckedChange={(checked) =>
                              updateRejectionReason(activeFileType, code, { enabled: checked })
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {code}
                              </code>
                              <Badge
                                variant="outline"
                                className={
                                  reason.severity === "high"
                                    ? "border-red-500 text-red-600"
                                    : reason.severity === "medium"
                                    ? "border-yellow-500 text-yellow-600"
                                    : "border-blue-500 text-blue-600"
                                }
                              >
                                {reason.severity}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {reason.category.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm">{reason.message}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRejectionReason(activeFileType, code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Rules Tab */}
        <TabsContent value="marketplaces" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Rules</CardTitle>
              <CardDescription>Configure specific requirements for each marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMarketplace} onValueChange={setActiveMarketplace}>
                <TabsList className="mb-4">
                  {marketplaces.map((marketplace) => (
                    <TabsTrigger key={marketplace} value={marketplace}>
                      {marketplace}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {currentMarketplace && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Resolution (pixels)</Label>
                        <Input
                          type="number"
                          value={currentMarketplace.min_resolution}
                          onChange={(e) =>
                            updateMarketplaceRule(activeMarketplace, {
                              min_resolution: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          e.g., 4000000 for 4MP
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Dimension (px)</Label>
                        <Input
                          type="number"
                          value={currentMarketplace.min_dimension}
                          onChange={(e) =>
                            updateMarketplaceRule(activeMarketplace, {
                              min_dimension: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Smallest side in pixels
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Allowed Formats</Label>
                      <Input
                        value={currentMarketplace.allowed_formats.join(", ")}
                        onChange={(e) =>
                          updateMarketplaceRule(activeMarketplace, {
                            allowed_formats: e.target.value.split(",").map((s) => s.trim().toLowerCase()),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated list of file extensions
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={currentMarketplace.notes}
                        onChange={(e) =>
                          updateMarketplaceRule(activeMarketplace, { notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Configuration</CardTitle>
              <CardDescription>Adjust how different categories affect the overall score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Weights */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Category Weights</h4>
                  <Badge variant="outline">
                    Total: {Object.values(localWeights).reduce((a, b) => a + b, 0)}%
                  </Badge>
                </div>
                
                {Object.entries(localWeights).map(([category, weight]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="capitalize">{category.replace("_", " ")}</Label>
                      <span className="text-sm font-medium">{weight}%</span>
                    </div>
                    <Slider
                      value={[weight]}
                      onValueChange={([v]) =>
                        setLocalWeights({ ...localWeights, [category]: v })
                      }
                      max={100}
                      step={5}
                    />
                  </div>
                ))}
                
                <Button onClick={handleSaveWeights} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Weights
                </Button>
              </div>

              {/* Thresholds */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Verdict Thresholds</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Pass Threshold</Label>
                      <span className="text-sm font-medium text-green-600">{localThresholds.pass}+</span>
                    </div>
                    <Slider
                      value={[localThresholds.pass]}
                      onValueChange={([v]) => setLocalThresholds({ ...localThresholds, pass: v })}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Score at or above this = PASS verdict
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Warning Threshold</Label>
                      <span className="text-sm font-medium text-yellow-600">{localThresholds.warning}-{localThresholds.pass - 1}</span>
                    </div>
                    <Slider
                      value={[localThresholds.warning]}
                      onValueChange={([v]) => setLocalThresholds({ ...localThresholds, warning: v })}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Score in this range = WARNING. Below = FAIL
                    </p>
                  </div>
                </div>
                
                <Button onClick={handleSaveThresholds} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Thresholds
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>
      </main>
    </>
  );
}
