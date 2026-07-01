import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dns from "dns/promises";

const BLACKLISTS = [
  "zen.spamhaus.org",
  "b.barracudacentral.org",
  "bl.spamcop.net"
];

async function checkBlacklist(domainOrIp: string) {
  let isListed = false;
  let listedOn = [];

  for (const rbl of BLACKLISTS) {
    try {
      // Basic check by appending domain to RBL.
      // Usually, you resolve the IP first, then reverse it (e.g. 1.2.3.4 -> 4.3.2.1.rbl.org)
      // But checking the domain directly works for some RBLs like Spamhaus DBL
      const query = `${domainOrIp}.${rbl}`;
      const records = await dns.resolve4(query);
      
      if (records && records.length > 0) {
        isListed = true;
        listedOn.push(rbl);
      }
    } catch (e: any) {
      // ENOTFOUND means not listed
      if (e.code !== 'ENOTFOUND') {
        console.error(`Error checking ${rbl}:`, e.message);
      }
    }
  }

  return { isListed, listedOn };
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domain = await prisma.domain.findUnique({
      where: { id: params.id }
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // A real system would get the A record IP of the MX or sending server.
    // We'll just check the domain name directly for simplicity in this MVP.
    const result = await checkBlacklist(domain.domainName);

    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        blacklistStatus: result.isListed ? "LISTED" : "CLEAN",
        healthScore: result.isListed ? 50 : 100
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Blacklist check failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
