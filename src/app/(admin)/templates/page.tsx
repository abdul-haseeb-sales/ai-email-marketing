import { FileText, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email templates with personalization variables.
          </p>
        </div>
        <Link 
          href="/templates/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Link>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search templates..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
        </div>
        <div className="p-0">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No templates found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                You haven't created any templates yet. Start by creating a personalized email template.
              </p>
              <Link 
                href="/templates/new"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </Link>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Created On</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {template.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[250px] truncate">
                        {template.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {template.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-xs font-medium mr-4">Edit</button>
                        <button className="text-destructive hover:underline text-xs font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
