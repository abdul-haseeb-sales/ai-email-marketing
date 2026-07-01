import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ERPNextClient } from "@/lib/erpnext";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const settings = await prisma.eRPNextSettings.findUnique({
      where: { organizationId: org.id }
    });

    if (!settings || !settings.url || !settings.apiKey) {
      return NextResponse.json({ error: "ERPNext not configured" }, { status: 400 });
    }

    const client = new ERPNextClient(settings.url, settings.apiKey, settings.apiSecret);

    // Create a master list for ERPNext imports if it doesn't exist
    let masterList = await prisma.leadList.findFirst({
      where: { organizationId: org.id, name: "ERPNext Master List" }
    });

    if (!masterList) {
      masterList = await prisma.leadList.create({
        data: {
          organizationId: org.id,
          name: "ERPNext Master List",
          description: "Auto-synced from ERPNext Contacts and Leads"
        }
      });
    }

    let leadsAdded = 0;
    let contactsAdded = 0;

    // Sync Leads
    if (settings.autoSyncLeads) {
      const erpLeads = await client.fetchDoctype("Lead", ["name", "lead_name", "first_name", "last_name", "email_id", "company_name", "industry", "city", "country"]);
      
      for (const l of erpLeads) {
        if (!l.email_id) continue;
        
        const existing = await prisma.lead.findUnique({
          where: { organizationId_email: { organizationId: org.id, email: l.email_id } }
        });

        if (!existing) {
          await prisma.lead.create({
            data: {
              organizationId: org.id,
              listId: masterList.id,
              email: l.email_id,
              firstName: l.first_name || l.lead_name,
              lastName: l.last_name,
              businessName: l.company_name,
              industry: l.industry,
              city: l.city,
              country: l.country,
              source: "ERPNEXT",
              erpnextId: l.name,
              erpnextType: "Lead"
            }
          });
          leadsAdded++;
        }
      }
    }

    // Sync Contacts
    if (settings.autoSyncContacts) {
      const erpContacts = await client.fetchDoctype("Contact", ["name", "first_name", "last_name", "email_id", "company_name"]);
      
      for (const c of erpContacts) {
        if (!c.email_id) continue;
        
        const existing = await prisma.lead.findUnique({
          where: { organizationId_email: { organizationId: org.id, email: c.email_id } }
        });

        if (!existing) {
          await prisma.lead.create({
            data: {
              organizationId: org.id,
              listId: masterList.id,
              email: c.email_id,
              firstName: c.first_name,
              lastName: c.last_name,
              businessName: c.company_name,
              source: "ERPNEXT",
              erpnextId: c.name,
              erpnextType: "Contact"
            }
          });
          contactsAdded++;
        }
      }
    }

    await prisma.eRPNextSettings.update({
      where: { id: settings.id },
      data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({ success: true, leadsAdded, contactsAdded });
  } catch (error: any) {
    console.error("Failed to sync from ERPNext", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
