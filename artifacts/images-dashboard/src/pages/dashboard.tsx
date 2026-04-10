import { useGetImageStats, useListImages, getListImagesQueryKey, getGetImageStatsQueryKey } from "@workspace/api-client-react";
import { AddImageModal } from "@/components/images/add-image-modal";
import { ImageCard } from "@/components/images/image-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Database, CheckCircle2, Clock, XCircle, LayoutGrid } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ModeToggle } from "@/components/mode-toggle";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetImageStats();
  const { data: images, isLoading: imagesLoading } = useListImages();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetImageStatsQueryKey() });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md border border-primary/20">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">WildDev Images</h1>
              <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Production Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh Data" className="h-9 w-9">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <AddImageModal />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Images" 
            value={stats?.total} 
            loading={statsLoading} 
            icon={<Database className="w-4 h-4 text-slate-500" />} 
          />
          <StatCard 
            title="Processed" 
            value={stats?.processed} 
            loading={statsLoading} 
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} 
          />
          <StatCard 
            title="Queued" 
            value={stats?.queued} 
            loading={statsLoading} 
            icon={<Clock className="w-4 h-4 text-amber-500" />} 
          />
          <StatCard 
            title="Failed" 
            value={stats?.failed} 
            loading={statsLoading} 
            icon={<XCircle className="w-4 h-4 text-rose-500" />} 
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Gallery</h2>
            <div className="text-xs text-muted-foreground font-mono">
              {images?.length || 0} ITEMS
            </div>
          </div>
          
          {imagesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50">
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !images || images.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/10 text-center">
              <Database className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No images found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Upload your first image or queue an external URL to start processing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <ImageCard key={image.id} image={image} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, loading, icon }: { title: string; value?: number; loading: boolean; icon: React.ReactNode }) {
  return (
    <Card className="bg-card shadow-sm border-border/50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold font-mono">{value || 0}</p>
          )}
        </div>
        <div className="p-2 bg-muted rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}