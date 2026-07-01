"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw, Database } from "lucide-react";

export default function ERPNextSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    url: "",
    apiKey: "",
    apiSecret: "",
    autoSyncLeads: true,
    autoSyncContacts: true,
  });

  useEffect(() => {
    fetch("/api/erpnext/settings")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/erpnext/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully.");
      } else {
        alert("Failed to save settings.");
      }
    } catch (e) {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/erpnext/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Sync complete! Added ${data.leadsAdded} Leads and ${data.contactsAdded} Contacts.`);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (e) {
      alert("An error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ERPNext Integration</h1>
        <p className="text-muted-foreground">
          Connect your Frappe/ERPNext v16 instance for a 100% native synchronization experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleSave} className="flex flex-col gap-6 bg-card border rounded-xl p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> API Connection
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Configure your ERPNext base URL and API tokens.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">ERPNext Site URL</Label>
            <Input
              id="url"
              placeholder="https://erp.yourdomain.com"
              value={settings.url}
              onChange={(e) => setSettings({ ...settings, url: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              placeholder="e.g. 1a2b3c4d5e"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="e.g. 9f8e7d6c5b"
              value={settings.apiSecret}
              onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={settings.autoSyncLeads}
                onChange={(e) => setSettings({ ...settings, autoSyncLeads: e.target.checked })}
              />
              Auto-Sync CRM Leads
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={settings.autoSyncContacts}
                onChange={(e) => setSettings({ ...settings, autoSyncContacts: e.target.checked })}
              />
              Auto-Sync Contacts
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Manual Sync</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pull the latest Contacts and Leads immediately from ERPNext. New contacts will be assigned to a master list.
            </p>
            <Button onClick={handleManualSync} disabled={syncing} variant="outline" className="w-full gap-2">
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing with ERPNext..." : "Sync Now"}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-blue-800 font-semibold mb-2">How it works</h3>
            <ul className="text-sm text-blue-700 list-disc pl-4 space-y-2">
              <li>Leads and Contacts imported via ERPNext's Data Import tool will automatically appear here.</li>
              <li>Emails sent from campaigns will be pushed to the Lead's timeline in ERPNext as <strong>Communication</strong> logs.</li>
              <li>Replies and Bounces will also automatically sync back to ERPNext.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
