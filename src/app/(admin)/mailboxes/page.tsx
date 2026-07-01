import { Inbox, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddMailboxDialog } from "@/components/mailboxes/AddMailboxDialog";
import { TestConnectionButton } from "@/components/mailboxes/TestConnectionButton";

export default async function MailboxesPage() {
  const mailboxes = await prisma.mailbox.findMany({
    orderBy: { createdAt: "desc" },
    include: { domain: true },
  });

  const domains = await prisma.domain.findMany({
    orderBy: { domainName: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mailboxes</h1>
          <p className="text-muted-foreground">
            Manage your SMTP/IMAP credentials and configure sending limits.
          </p>
        </div>
        <AddMailboxDialog domains={domains} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search mailboxes..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
        </div>
        <div className="p-0">
          {mailboxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No mailboxes found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                You haven't added any mailboxes yet. Connect your first SMTP/IMAP account to start sending.
              </p>
              <AddMailboxDialog domains={domains} />
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Daily Limit</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxes.map((mailbox) => (
                    <tr key={mailbox.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {mailbox.email}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {mailbox.domain.domainName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mailbox.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {mailbox.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {mailbox.dailyLimit} emails/day
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-xs font-medium mr-4">Edit</button>
                        <TestConnectionButton mailboxId={mailbox.id} />
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
