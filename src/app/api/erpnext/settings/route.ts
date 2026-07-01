import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json(null);

    const settings = await prisma.eRPNextSettings.findUnique({
      where: { organizationId: org.id }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch ERPNext settings", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, apiKey, apiSecret, autoSyncLeads, autoSyncContacts } = await req.json();

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({ data: { name: "Right Innovations" }});
    }

    const settings = await prisma.eRPNextSettings.upsert({
      where: { organizationId: org.id },
      update: { url, apiKey, apiSecret, autoSyncLeads, autoSyncContacts },
      create: { 
        organizationId: org.id, 
        url, 
        apiKey, 
        apiSecret, 
        autoSyncLeads, 
        autoSyncContacts 
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to save ERPNext settings", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
