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

    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("Failed to fetch domains", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainName } = await req.json();

    if (!domainName) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 });
    }

    // MVP: For a single tenant self-hosted app, get or create a default organization.
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Right Innovations" }
      });
    }

    const existing = await prisma.domain.findUnique({
      where: { domainName }
    });

    if (existing) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
    }

    const newDomain = await prisma.domain.create({
      data: {
        domainName,
        organizationId: org.id,
      }
    });

    return NextResponse.json(newDomain);
  } catch (error) {
    console.error("Failed to create domain", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
