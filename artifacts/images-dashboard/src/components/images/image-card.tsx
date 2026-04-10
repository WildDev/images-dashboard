import { Image as ImageIcon, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, FileImage, ImageOff } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Image,
  useDeleteImage,
  getListImagesQueryKey,
  getGetImageStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { Skeleton } from "@/components/ui/skeleton";

interface ImageCardProps {
  image: Image;
}

const statusConfig = {
  NEW: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  QUEUED: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  PROCESSED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  FAILED: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  EXPIRED: { icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

export function ImageCard({ image }: ImageCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteImage = useDeleteImage();

  const config = statusConfig[image.status] || statusConfig.NEW;
  const StatusIcon = config.icon;

  const handleDelete = () => {
    deleteImage.mutate(
      { data: { id: image.id } },
      {
        onSuccess: () => {
          toast({ title: "Image deleted" });
          queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetImageStatsQueryKey() });
        },
        onError: (err) => {
          toast({
            title: "Failed to delete image",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const isProcessed = image.status === "PROCESSED";
  const isFailed = image.status === "FAILED";

  return (
    <Card className="overflow-hidden group hover:border-primary/30 transition-colors bg-card flex flex-col">
      <div className="relative aspect-video bg-muted/30 flex items-center justify-center overflow-hidden border-b">
        {isProcessed ? (
          <img
            src={`/api/images/find/${image.id}`}
            alt={image.id}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIi8+PHBhdGggZD0ibTIxIDE1LTMuMDgtMy4wOGExLjIgMS4yIDAgMCAwLTEuNzEgMGwtNS4yNSA1LjI1Ii8+PHBhdGggZD0ibTE2IDEwLTMuMDgtMy4wOGExLjIgMS4yIDAgMCAwLTEuNzEgMGwtMyA0Ii8+PC9zdmc+';
            }}
          />
        ) : isFailed ? (
          <div className="flex flex-col items-center text-muted-foreground gap-2">
            <ImageOff className="w-8 h-8 opacity-50" />
            <span className="text-xs font-medium">Processing failed</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center text-muted-foreground gap-3">
              <Skeleton className="w-full h-full absolute inset-0" />
              <div className="z-10 flex flex-col items-center gap-2 bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm border shadow-sm">
                <StatusIcon className={`w-4 h-4 animate-pulse ${config.color}`} />
                <span className="text-xs font-mono tracking-wider font-semibold uppercase">{image.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-8 w-8 shadow-md">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The image and all processed variants will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <Badge 
          variant="outline" 
          className={`absolute top-2 left-2 ${config.bg} ${config.color} ${config.border} font-mono text-[10px] tracking-wider px-2 py-0.5 backdrop-blur-sm bg-background/80`}
        >
          {image.status}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col gap-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-mono text-xs text-muted-foreground truncate" title={image.id}>
              {image.id.split('-')[0]}...
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <FileImage className="w-3 h-3" />
                {image.contentType?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
              </span>
              {image.width && image.height && (
                <>
                  <span className="text-border">•</span>
                  <span className="font-mono text-muted-foreground">
                    {image.width}×{image.height}
                  </span>
                </>
              )}
            </div>
          </div>
          {image.multiSize && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap bg-secondary/50">
              Multi-size
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <span title={new Date(image.added).toLocaleString()}>
            {format(new Date(image.added), 'MMM d, yyyy')}
          </span>
          {image.sourceUrl && (
            <span className="truncate max-w-[120px] text-[10px] font-mono opacity-70" title={image.sourceUrl}>
              External
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
