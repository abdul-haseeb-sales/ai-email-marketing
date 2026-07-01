import { Mail, Search, RefreshCw, Inbox as InboxIcon, CornerUpLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SyncInboxButton } from "@/components/inbox/SyncInboxButton";

export default async function InboxPage() {
  const messages = await prisma.inboxMessage.findMany({
    orderBy: { receivedAt: "desc" },
    include: {
      mailbox: true,
      lead: true
    }
  });

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Inbox</h1>
          <p className="text-muted-foreground">
            Manage replies and bounced emails across all your campaigns and domains.
          </p>
        </div>
        <SyncInboxButton />
      </div>

      <div className="rounded-xl border bg-card shadow-sm flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 border-r flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search messages..."
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
                <InboxIcon className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No messages found in your inbox.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map(msg => (
                  <button 
                    key={msg.id} 
                    className={`text-left p-4 border-b hover:bg-muted/50 transition-colors ${!msg.isRead ? 'bg-muted/20' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm ${!msg.isRead ? 'font-bold' : 'font-medium'}`}>
                        {msg.lead?.firstName ? `${msg.lead.firstName} ${msg.lead.lastName || ''}` : msg.fromEmail}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {new Date(msg.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-primary mb-1 truncate">
                      To: {msg.mailbox.email}
                    </div>
                    <div className={`text-sm truncate mb-1 ${!msg.isRead ? 'font-semibold' : ''}`}>
                      {msg.subject}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {msg.body.substring(0, 100)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail View */}
        <div className="flex-1 flex flex-col h-full bg-muted/5">
          {messages.length > 0 ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b bg-card">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{messages[0].subject}</h2>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 gap-2">
                      <CornerUpLeft className="h-4 w-4" />
                      Reply
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{messages[0].fromEmail}</span>
                    <span className="text-muted-foreground mx-2">to</span>
                    <span className="text-muted-foreground">{messages[0].mailbox.email}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(messages[0].receivedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm">
                {messages[0].body}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Mail className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
