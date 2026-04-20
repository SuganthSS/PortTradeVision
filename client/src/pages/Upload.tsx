import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, Loader2, X } from "lucide-react";
// removed apiRequest import intentionally so fetch is used directly
// import { apiRequest } from "@/lib/queryClient";

type ColumnMapping = {
  date?: string;
  port?: string;
  product?: string;
  type?: string;
  quantity?: string;
  value?: string;
};

export default function Upload() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));

      if (rows.length > 0) {
        setHeaders(rows[0]);
        setPreview(rows.slice(1, 6));
      }
    };
    reader.readAsText(selectedFile);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as any;
      handleFileChange(fakeEvent);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function clearFile() {
    setFile(null);
    setPreview([]);
    setHeaders([]);
    setMapping({});
  }

  // Replaced upload logic: directly use fetch with FormData so browser sets multipart content-type
  async function handleUpload() {
    if (!file) return;

    const requiredFields = ["date", "port", "product", "type", "quantity", "value"];
    const missingFields = requiredFields.filter((field) => !mapping[field as keyof ColumnMapping]);

    if (missingFields.length > 0) {
      toast({
        title: "Incomplete mapping",
        description: `Please map all required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // send mapping as JSON string; server can parse JSON from req.body.mapping
      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        // credentials: "include" // uncomment if server expects cookie/session
      });

      if (!res.ok) {
        // try to extract JSON error body, otherwise use status text
        let errBody: any = { message: res.statusText };
        try {
          errBody = await res.json();
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errBody.message || `Upload failed (${res.status})`);
      }

      const result = await res.json();

      toast({
        title: "Success",
        description: result.message || "CSV file uploaded and processed successfully",
      });

      clearFile();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2">Upload CSV</h2>
          <p className="text-muted-foreground">Import transaction data from CSV files</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card data-testid="card-upload">
              <CardHeader>
                <CardTitle className="text-foreground">File Upload</CardTitle>
                <CardDescription>Upload a CSV file with transaction data</CardDescription>
              </CardHeader>
              <CardContent>
                {!file ? (
                  <div
                    className="border-2 border-dashed border-border rounded-md p-12 text-center hover-elevate cursor-pointer transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById("file-input")?.click()}
                    data-testid="dropzone-upload"
                  >
                    <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Drop your CSV file here
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse files
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file"
                    />
                    <Button variant="outline" size="sm">
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground" data-testid="text-filename">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearFile} data-testid="button-clear">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {preview.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Preview (first 5 rows)</h3>
                        <div className="border rounded-md overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {headers.map((header, i) => (
                                  <TableHead key={i}>{header}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preview.map((row, i) => (
                                <TableRow key={i}>
                                  {row.map((cell, j) => (
                                    <TableCell key={j}>{cell}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card data-testid="card-mapping">
              <CardHeader>
                <CardTitle className="text-foreground">Column Mapping</CardTitle>
                <CardDescription>Map CSV columns to data fields</CardDescription>
              </CardHeader>
              <CardContent>
                {!file ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Upload a file to configure mapping</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "date", label: "Date", required: true },
                      { key: "port", label: "Port", required: true },
                      { key: "product", label: "Product", required: true },
                      { key: "type", label: "Type (Import/Export)", required: true },
                      { key: "quantity", label: "Quantity", required: true },
                      { key: "value", label: "Value", required: true },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-destructive">*</span>}
                        </label>
                        <Select
                          value={mapping[field.key as keyof ColumnMapping] || ""}
                          onValueChange={(value) =>
                            setMapping({ ...mapping, [field.key]: value })
                          }
                        >
                          <SelectTrigger data-testid={`select-mapping-${field.key}`}>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}

                    <Button
                      className="w-full mt-6"
                      onClick={handleUpload}
                      disabled={isUploading}
                      data-testid="button-upload"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Upload & Process
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
