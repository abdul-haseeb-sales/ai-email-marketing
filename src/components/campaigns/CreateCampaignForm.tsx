"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateCampaignForm({ 
  lists, 
  templates, 
  mailboxes 
}: { 
  lists: any[], 
  templates: any[], 
  mailboxes: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    listId: "",
    templateId: "",
    mailboxId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      router.push("/campaigns");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid gap-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          placeholder="e.g. Q3 Sales Outreach"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="list">Lead List (Audience)</Label>
        <Select
          value={formData.listId}
          onValueChange={(val) => setFormData({ ...formData, listId: val })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a list of leads" />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name} ({list._count.leads} leads)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="template">Email Template</Label>
        <Select
          value={formData.templateId}
          onValueChange={(val) => setFormData({ ...formData, templateId: val })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an email template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} - "{template.subject}"
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="mailbox">Sending Mailbox</Label>
        <Select
          value={formData.mailboxId}
          onValueChange={(val) => setFormData({ ...formData, mailboxId: val })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a mailbox to send from" />
          </SelectTrigger>
          <SelectContent>
            {mailboxes.map((mb) => (
              <SelectItem key={mb.id} value={mb.id}>
                {mb.email} ({mb.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Only ACTIVE mailboxes will send emails reliably.
        </p>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={loading} className="gap-2">
          <Rocket className="h-4 w-4" />
          {loading ? "Creating..." : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}
