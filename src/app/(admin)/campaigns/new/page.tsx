import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";

export default async function NewCampaignPage() {
  const [lists, templates, mailboxes] = await Promise.all([
    prisma.leadList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { leads: true } }
      }
    }),
    prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.mailbox.findMany({
      orderBy: { email: "asc" },
    })
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground text-sm">
            Set up a new email sequence for your target audience.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <CreateCampaignForm 
          lists={lists} 
          templates={templates} 
          mailboxes={mailboxes} 
        />
      </div>
    </div>
  );
}
