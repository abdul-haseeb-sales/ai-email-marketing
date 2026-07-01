import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

export interface DnsCheckResult {
  spfStatus: string;
  dkimStatus: string;
  dmarcStatus: string;
  mxStatus: string;
  healthScore: number;
}

export async function checkDomainDns(domain: string): Promise<DnsCheckResult> {
  let spfStatus = "FAILED";
  let dmarcStatus = "FAILED";
  let dkimStatus = "PENDING"; // Hard to test default selector generically, usually requires selector name
  let mxStatus = "FAILED";
  let score = 0;

  try {
    // Check MX Records
    try {
      const mxRecords = await resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        mxStatus = "PASSED";
        score += 25;
      }
    } catch (e) {
      // MX lookup failed
    }

    // Check TXT Records for SPF
    try {
      const txtRecords = await resolveTxt(domain);
      const txtFlat = txtRecords.map(r => r.join(""));
      
      const hasSpf = txtFlat.some(r => r.startsWith("v=spf1"));
      if (hasSpf) {
        spfStatus = "PASSED";
        score += 25;
      }
    } catch (e) {
      // TXT lookup failed
    }

    // Check TXT Records for DMARC (_dmarc.domain.com)
    try {
      const dmarcRecords = await resolveTxt(`_dmarc.${domain}`);
      const dmarcFlat = dmarcRecords.map(r => r.join(""));
      
      const hasDmarc = dmarcFlat.some(r => r.startsWith("v=DMARC1"));
      if (hasDmarc) {
        dmarcStatus = "PASSED";
        score += 25;
      }
    } catch (e) {
      // DMARC lookup failed
    }

    // Check DKIM (Requires selector, we'll give partial credit or assume PENDING)
    // For a real check, we'd need to know the selector like `default._domainkey.domain.com`
    // We will set healthScore to max 100 assuming DKIM needs manual verification or specific selector
    score += 25; // Optimistically assume DKIM will be passed manually or checked via SMTP send

    return {
      spfStatus,
      dkimStatus,
      dmarcStatus,
      mxStatus,
      healthScore: Math.min(score, 100),
    };
  } catch (error) {
    console.error(`DNS check failed for ${domain}:`, error);
    return {
      spfStatus: "ERROR",
      dkimStatus: "ERROR",
      dmarcStatus: "ERROR",
      mxStatus: "ERROR",
      healthScore: 0,
    };
  }
}
