import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dropzone } from "@/components/ui/dropzone";
import {
  useAddExternalImage,
  useUploadImage,
  getListImagesQueryKey,
  getGetImageStatsQueryKey,
} from "@workspace/api-client-react";
import { Plus, Link as LinkIcon, Upload } from "lucide-react";

const urlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  multiSize: z.boolean().default(false),
});

type UrlFormValues = z.infer<typeof urlSchema>;

export function AddImageModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [multiSizeFile, setMultiSizeFile] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const addExternalImage = useAddExternalImage();
  const uploadImage = useUploadImage();

  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
      multiSize: false,
    },
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetImageStatsQueryKey() });
    setOpen(false);
    setFile(null);
    urlForm.reset();
  };

  const onUrlSubmit = (data: UrlFormValues) => {
    addExternalImage.mutate(
      { data: { url: data.url, multiSize: data.multiSize } },
      {
        onSuccess: () => {
          toast({ title: "Image queued successfully" });
          onSuccess();
        },
        onError: (err) => {
          toast({
            title: "Failed to queue image",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const onFileUpload = () => {
    if (!file) return;
    
    // Create form data using the expected format for the generated hook
    uploadImage.mutate(
      { data: { file, multiSize: multiSizeFile } },
      {
        onSuccess: () => {
          toast({ title: "Image uploaded successfully" });
          onSuccess();
        },
        onError: (err) => {
          toast({
            title: "Failed to upload image",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Image</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>
            Upload a local file or queue an external URL for processing.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {!file ? (
              <Dropzone onDrop={setFile} />
            ) : (
              <div className="p-4 border rounded-md bg-muted/30 flex items-center justify-between">
                <div className="truncate flex-1 max-w-[250px]">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Clear
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between space-x-2 pt-2">
              <Label htmlFor="multisize-file" className="flex flex-col space-y-1">
                <span>Generate Multiple Sizes</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Creates responsive variants automatically
                </span>
              </Label>
              <Switch 
                id="multisize-file" 
                checked={multiSizeFile}
                onCheckedChange={setMultiSizeFile}
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              disabled={!file || uploadImage.isPending}
              onClick={onFileUpload}
            >
              {uploadImage.isPending ? "Uploading..." : "Upload File"}
            </Button>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <form onSubmit={urlForm.handleSubmit(onUrlSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">External Image URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/image.jpg"
                  {...urlForm.register("url")}
                />
                {urlForm.formState.errors.url && (
                  <p className="text-xs text-destructive">
                    {urlForm.formState.errors.url.message}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between space-x-2 pt-2">
                <Label htmlFor="multisize-url" className="flex flex-col space-y-1">
                  <span>Generate Multiple Sizes</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Creates responsive variants automatically
                  </span>
                </Label>
                <Switch 
                  id="multisize-url"
                  checked={urlForm.watch("multiSize")}
                  onCheckedChange={(val) => urlForm.setValue("multiSize", val)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={addExternalImage.isPending}
              >
                {addExternalImage.isPending ? "Queueing..." : "Process URL"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
