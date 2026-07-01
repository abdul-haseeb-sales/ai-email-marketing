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

    const lists = await prisma.leadList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { leads: true }
        }
      }
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("Failed to fetch lead lists", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Right Innovations" }
      });
    }

    const newList = await prisma.leadList.create({
      data: {
        name,
        description,
        organizationId: org.id,
      }
    });

    return NextResponse.json(newList);
  } catch (error) {
    console.error("Failed to create lead list", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
