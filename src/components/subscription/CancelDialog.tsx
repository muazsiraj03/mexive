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
import { Subscription } from "@/hooks/use-subscription";
import { format } from "date-fns";

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function CancelDialog({ 
  open, 
  onOpenChange, 
  subscription,
  onConfirm,
  loading 
}: CancelDialogProps) {
  if (!subscription) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel your <strong>{subscription.plan}</strong> subscription?
            </p>
            {subscription.expiresAt && (
              <p>
                You'll retain access to all features until{" "}
                <strong>{format(subscription.expiresAt, "MMMM d, yyyy")}</strong>.
                After that, you'll be moved to the Free plan with 5 credits.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="rounded-full">
            Keep Subscription
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Canceling..." : "Yes, Cancel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
