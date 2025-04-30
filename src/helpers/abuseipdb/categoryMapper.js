/**
 * Mapping otomatis Wazuh rule → AbuseIPDB category.
 * Termasuk support SSH (5700–5764) dan Web Access (31100–31171)
 */

function classifyAlertToAbuseCategoryByRule(alert = {}) {
    const ruleId = parseInt(alert?.rule?.id);
    const description = (alert?.rule?.description || '').toLowerCase();
  
    // === 1. ID Mapping Presisi ===
    const idMap = {
      // SSH-based: 5700–5764
      5701: [15, 19],
      5702: [15],
      5703: [15],
      5705: [22, 19],
      5706: [14, 15],
      5707: [24, 18],
      5710: [22, 19],
      5712: [22, 19],
      5714: [24],
      5716: [22, 19],
      5720: [22, 19],
      5726: [15],
      5731: [14],
      5733: [22, 19],
      5760: [22, 19],
      5763: [22, 19],
  
      // Web-based: 31100–31171
      31101: [18],          // 400 error
      31103: [16, 18],      // SQLi
      31104: [18],          // Common web attack
      31105: [18],          // XSS
      31106: [18],          // Web attack with 200
      31109: [16, 18],      // MSSQL injection
      31110: [18, 24],      // PHP CGI vuln
      31115: [18],          // Long URL
      31120: [10, 18],      // 500 error
      31121: [10, 18],
      31122: [10, 18],
      31123: [10, 18],
      31151: [18, 10],      // multiple 400s
      31152: [16, 18],      // multiple SQLi
      31153: [18],          // multiple web attacks
      31154: [18],          // multiple XSS
      31164: [16, 18],
      31165: [16, 18],
      31166: [24, 18],      // Shellshock
      31167: [24, 18],
      31168: [24, 18],
      31169: [24, 18],
      31170: [16, 18],
      31171: [16, 18],
    };
  
    if (idMap[ruleId]) return idMap[ruleId];
  
    // === 2. Fallback Pattern Matching ===
    const patternMap = [
      { match: /web server 400 error/, category: [18] },
      { match: /multiple web server 400/i, category: [18, 10] },
      { match: /sql injection|select%20|union/i, category: [16, 18] },
      { match: /xss|cross site scripting/i, category: [18] },
      { match: /ssh attack|brute force/i, category: [22, 19] },
      { match: /exploit|shellshock/i, category: [24, 18] },
      { match: /scan/i, category: [14] },
      { match: /failed login|invalid user/i, category: [22] },
    ];
  
    for (const pattern of patternMap) {
      if (pattern.match.test(description)) return pattern.category;
    }
  
    // === 3. Default fallback ===
    return [15]; // General hacking
  }
  
module.exports = { classifyAlertToAbuseCategoryByRule };
  