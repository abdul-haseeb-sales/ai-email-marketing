import { Rocket, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CampaignActionButtons } from "@/components/campaigns/CampaignActionButtons";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      list: true,
      template: true,
      mailbox: true,
      _count: {
        select: { emailLogs: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your email outreach campaigns and automated sending.
          </p>
        </div>
        <Link 
          href="/campaigns/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Link>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search campaigns..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            />
          </div>
        </div>
        <div className="p-0">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No campaigns found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                You haven't created any campaigns yet. Connect a mailbox, list, and template to start sending.
              </p>
              <Link 
                href="/campaigns/new"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3">Campaign</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">List / Audience</th>
                    <th className="px-6 py-3">Mailbox</th>
                    <th className="px-6 py-3">Sent</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {campaign.name}
                        <div className="text-xs text-muted-foreground font-normal mt-0.5">
                          Tpl: {campaign.template.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {campaign.list.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {campaign.mailbox.email}
                      </td>
                      <td className="px-6 py-4">
                        {campaign._count.emailLogs}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <CampaignActionButtons campaignId={campaign.id} status={campaign.status} />
                        <button className="text-primary hover:underline text-xs font-medium">View</button>
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
