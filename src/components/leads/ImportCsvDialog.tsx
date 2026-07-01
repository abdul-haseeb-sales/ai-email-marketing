"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Papa from "papaparse";

export function ImportCsvDialog({ listId, listName }: { listId: string, listName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ imported: number, duplicates: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rawData = results.data as any[];
          
          // Map common CSV headers to our schema
          const mappedLeads = rawData.map(row => {
            return {
              email: row.email || row.Email || row.EMAIL,
              firstName: row.firstName || row.first_name || row['First Name'] || row.FirstName,
              lastName: row.lastName || row.last_name || row['Last Name'] || row.LastName,
              businessName: row.company || row.businessName || row.Company || row.Business,
              phone: row.phone || row.Phone || row.telephone,
              website: row.website || row.Website || row.url,
              industry: row.industry || row.Industry,
              city: row.city || row.City,
              country: row.country || row.Country
            };
          }).filter(lead => !!lead.email); // Must have email

          if (mappedLeads.length === 0) {
            throw new Error("No valid emails found in the CSV file.");
          }

          setProgress(50); // Parsed

          // Send to API
          const res = await fetch(`/api/lists/${listId}/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leads: mappedLeads }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to import leads");
          }

          setProgress(100);
          setResult({ imported: data.imported, duplicates: data.duplicates });
          router.refresh();

        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
      },
      error: (error) => {
        setError(error.message);
        setLoading(false);
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button className="text-primary hover:underline text-xs font-medium mr-4 inline-flex items-center gap-1">
          <Upload className="h-3 w-3 inline" />
          Import CSV
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Leads to {listName}</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your leads. The file must contain an "email" column.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 bg-muted/20">
              <Upload className="h-8 w-8 text-muted-foreground mb-4" />
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <Label 
                htmlFor="csv-upload" 
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 disabled:opacity-50"
              >
                {loading ? `Processing... ${progress}%` : "Select CSV File"}
              </Label>
              <p className="text-xs text-muted-foreground mt-4">
                Supported headers: email, firstName, lastName, company, phone, website...
              </p>
            </div>
          ) : (
            <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-4 text-center dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50">
              <h3 className="font-semibold text-lg mb-2">Import Successful!</h3>
              <p>Successfully added {result.imported} new leads.</p>
              {result.duplicates > 0 && (
                <p className="text-sm mt-1 opacity-80">Skipped {result.duplicates} duplicate leads.</p>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {result ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
