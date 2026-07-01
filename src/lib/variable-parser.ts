/**
 * Replaces variables in a template string with actual values from a lead.
 * e.g., "Hi {{first_name}}" -> "Hi John"
 */
export function parseTemplateVariables(templateStr: string, lead: any): string {
  if (!templateStr) return "";
  
  let parsedStr = templateStr;

  // Define mapping from variable tag to lead property
  const variableMap: Record<string, string> = {
    "{{first_name}}": lead.firstName || "",
    "{{last_name}}": lead.lastName || "",
    "{{business_name}}": lead.businessName || "",
    "{{industry}}": lead.industry || "",
    "{{city}}": lead.city || "",
    "{{country}}": lead.country || "",
    "{{website}}": lead.website || "",
  };

  // Replace each variable in the string
  for (const [variable, value] of Object.entries(variableMap)) {
    // Escape variable for regex just in case
    const regex = new RegExp(variable.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
    parsedStr = parsedStr.replace(regex, value);
  }

  // Parse Spintax {Option1|Option2|Option3}
  // Recursively process nested spintax if needed, but for MVP standard regex is fine.
  const spintaxRegex = /\{([^{}]+)\}/g;
  let spintaxMatch;
  while ((spintaxMatch = spintaxRegex.exec(parsedStr)) !== null) {
    const options = spintaxMatch[1].split('|');
    const randomChoice = options[Math.floor(Math.random() * options.length)];
    parsedStr = parsedStr.replace(spintaxMatch[0], randomChoice);
    spintaxRegex.lastIndex = 0; // Reset regex to catch any newly formed spintax or continue from start
  }

  return parsedStr;
}
