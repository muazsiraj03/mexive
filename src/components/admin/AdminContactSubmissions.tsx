import { useState } from "react";
import {
  useContactSubmissions,
  useUpdateContactSubmission,
  useDeleteContactSubmission,
  ContactSubmission,
} from "@/hooks/use-contact-submissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Eye, Trash2, MoreHorizontal, CheckCircle, Clock, Archive, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AdminHeader } from "./AdminHeader";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  unread: { label: "Unread", variant: "default" },
  read: { label: "Read", variant: "secondary" },
  replied: { label: "Replied", variant: "outline" },
  archived: { label: "Archived", variant: "outline" },
};

export function AdminContactSubmissions() {
  const { data: submissions, isLoading } = useContactSubmissions();
  const updateSubmission = useUpdateContactSubmission();
  const deleteSubmission = useDeleteContactSubmission();

  const [viewingSubmission, setViewingSubmission] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const handleView = (submission: ContactSubmission) => {
    setViewingSubmission(submission);
    setAdminNotes(submission.admin_notes || "");
    
    // Mark as read if unread
    if (submission.status === "unread") {
      updateSubmission.mutate({ id: submission.id, status: "read" });
    }
  };

  const handleSaveNotes = () => {
    if (viewingSubmission) {
      updateSubmission.mutate({
        id: viewingSubmission.id,
        admin_notes: adminNotes,
      });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSubmission.mutate({ id, status });
  };

  const unreadCount = submissions?.filter((s) => s.status === "unread").length || 0;

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Contact Submissions" description="View and manage contact form submissions" />
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
      <AdminHeader title="Contact Submissions" description="View and manage contact form submissions" />
      
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="max-w-6xl space-y-6">
          {unreadCount > 0 && (
            <Badge variant="default" className="mb-4">{unreadCount} new submissions</Badge>
          )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No contact submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions?.map((submission) => {
                const status = statusConfig[submission.status] || statusConfig.unread;
                return (
                  <TableRow 
                    key={submission.id}
                    className={submission.status === "unread" ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.name}</p>
                        <p className="text-sm text-muted-foreground">{submission.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[300px] truncate">{submission.subject}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(submission.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`mailto:${submission.email}?subject=Re: ${submission.subject}`)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, "read")}>
                              <Clock className="w-4 h-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, "replied")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Replied
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, "archived")}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this submission from {submission.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSubmission.mutate(submission.id)}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Submission Dialog */}
      <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Submission</DialogTitle>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{viewingSubmission.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${viewingSubmission.email}`} className="font-medium text-primary hover:underline">
                    {viewingSubmission.email}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{viewingSubmission.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {viewingSubmission.message}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  rows={3}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleSaveNotes}
                  disabled={updateSubmission.isPending}
                >
                  Save Notes
                </Button>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    window.open(`mailto:${viewingSubmission.email}?subject=Re: ${viewingSubmission.subject}`);
                    handleStatusChange(viewingSubmission.id, "replied");
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reply via Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(viewingSubmission.id, "archived")}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </>
  );
}
