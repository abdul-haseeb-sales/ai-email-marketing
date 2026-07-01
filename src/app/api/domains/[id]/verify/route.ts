import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkDomainDns } from "@/lib/dns-checker";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainId = params.id;
    const domain = await prisma.domain.findUnique({
      where: { id: domainId }
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Run DNS checks
    const dnsResults = await checkDomainDns(domain.domainName);

    let sendingStatus = "SAFE";
    if (dnsResults.healthScore < 50) {
      sendingStatus = "RISKY";
    }

    // Update database
    const updatedDomain = await prisma.domain.update({
      where: { id: domainId },
      data: {
        spfStatus: dnsResults.spfStatus,
        dkimStatus: dnsResults.dkimStatus, // We might need manual DKIM verification later
        dmarcStatus: dnsResults.dmarcStatus,
        mxStatus: dnsResults.mxStatus,
        healthScore: dnsResults.healthScore,
        sendingStatus,
      }
    });

    return NextResponse.json(updatedDomain);
  } catch (error) {
    console.error("DNS verification failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
