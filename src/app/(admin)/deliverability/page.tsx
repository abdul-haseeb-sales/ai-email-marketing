import { Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlacklistCheckButton } from "@/components/deliverability/BlacklistCheckButton";

export default async function DeliverabilityPage() {
  const domains = await prisma.domain.findMany({
    orderBy: { domainName: "asc" },
    include: { mailboxes: true }
  });

  const mailboxes = domains.flatMap(d => d.mailboxes);
  const activeMailboxes = mailboxes.filter(m => m.status === "ACTIVE").length;

  const logs = await prisma.emailLog.findMany({
    where: {
      sentAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });

  const totalSent = logs.filter(l => l.status === "SENT").length;
  const totalFailed = logs.filter(l => l.status === "FAILED").length;
  
  const bounces = await prisma.lead.count({
    where: { status: "BOUNCED" }
  });

  const bounceRate = totalSent > 0 ? ((bounces / totalSent) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliverability Center</h1>
          <p className="text-muted-foreground">
            Monitor domain health, blacklist status, and bounce rates.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-2">
            <h3 className="tracking-tight text-sm font-medium">Domain Health</h3>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{domains.filter(d => d.healthScore > 80).length} / {domains.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Domains with good health</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Mailboxes</h3>
            <Activity className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{activeMailboxes}</div>
          <p className="text-xs text-muted-foreground mt-1">Sending emails safely</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-2">
            <h3 className="tracking-tight text-sm font-medium">7-Day Sent</h3>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{totalSent}</div>
          <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-2">
            <h3 className="tracking-tight text-sm font-medium">Bounce Rate</h3>
            <AlertTriangle className={`h-4 w-4 ${parseFloat(bounceRate) > 5 ? 'text-red-500' : 'text-yellow-500'}`} />
          </div>
          <div className="text-2xl font-bold">{bounceRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">{bounces} total bounces</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-4">Domain Blacklist Status</h2>
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3">Domain</th>
                <th className="px-6 py-3">Health Score</th>
                <th className="px-6 py-3">Blacklist Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {domain.domainName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2.5 max-w-[100px]">
                        <div 
                          className={`h-2.5 rounded-full ${domain.healthScore > 80 ? 'bg-green-500' : domain.healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${domain.healthScore}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{domain.healthScore}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {domain.blacklistStatus === "CLEAN" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Clean
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Listed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <BlacklistCheckButton domainId={domain.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
