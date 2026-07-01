import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;
    const list = await prisma.leadList.findUnique({
      where: { id: listId }
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const { leads } = await req.json(); // Array of parsed leads

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
    }

    let importedCount = 0;
    let duplicateCount = 0;

    for (const lead of leads) {
      const email = lead.email?.trim().toLowerCase();
      if (!email) continue;

      // Check if lead exists in the organization
      const existing = await prisma.lead.findUnique({
        where: {
          organizationId_email: {
            organizationId: list.organizationId,
            email: email
          }
        }
      });

      if (existing) {
        duplicateCount++;
        // Optionally update listId if it already exists, or just skip
      } else {
        await prisma.lead.create({
          data: {
            organizationId: list.organizationId,
            listId: list.id,
            email: email,
            firstName: lead.firstName || null,
            lastName: lead.lastName || null,
            businessName: lead.businessName || null,
            industry: lead.industry || null,
            city: lead.city || null,
            country: lead.country || null,
            phone: lead.phone || null,
            website: lead.website || null,
            source: "CSV Import",
          }
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      duplicates: duplicateCount 
    });
  } catch (error) {
    console.error("Lead import failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
