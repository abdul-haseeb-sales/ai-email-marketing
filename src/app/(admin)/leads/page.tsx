import { Users, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddListDialog } from "@/components/leads/AddListDialog";
import { ImportCsvDialog } from "@/components/leads/ImportCsvDialog";

export default async function LeadsPage() {
  const lists = await prisma.leadList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { leads: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads & Lists</h1>
          <p className="text-muted-foreground">
            Manage your contacts and segment them into targeted lists.
          </p>
        </div>
        <AddListDialog />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search lists..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
        </div>
        <div className="p-0">
          {lists.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No lead lists found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Create your first list to start importing contacts for your campaigns.
              </p>
              <AddListDialog />
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3">List Name</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Total Leads</th>
                    <th className="px-6 py-3">Created On</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map((list) => (
                    <tr key={list.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {list.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                        {list.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {list._count.leads} Leads
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(list.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ImportCsvDialog listId={list.id} listName={list.name} />
                        <button className="text-primary hover:underline text-xs font-medium">View Leads</button>
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
