export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the RI Outreach & Deliverability Manager.
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder Stat Cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Domains</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Mailboxes</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Emails Sent Today</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Reply Rate</h3>
          </div>
          <div className="text-2xl font-bold">0%</div>
        </div>
      </div>
    </div>
  );
}
