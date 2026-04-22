import axios from 'axios';

export const securityAuditService = {
  // Analizează header-ele de securitate ale unui URL și raportează riscurile teoretice
  auditHeaders: async (url: string) => {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      const headers = response.headers;
      
      const securityChecks = [
        { 
          header: 'content-security-policy', 
          risk: 'Potential XSS (Cross-Site Scripting)',
          description: 'Lipsa CSP permite executarea de scripturi neautorizate în browserul utilizatorului.'
        },
        { 
          header: 'strict-transport-security', 
          risk: 'Man-in-the-Middle (MitM)',
          description: 'Lipsa HSTS permite atacatorilor să forțeze conexiuni HTTP necriptate.'
        },
        { 
          header: 'x-content-type-options', 
          risk: 'MIME Sniffing',
          description: 'Lipsa acestui header permite browserului să interpreteze fișierele ca tipuri de conținut nesigure.'
        },
        { 
          header: 'x-frame-options', 
          risk: 'Clickjacking',
          description: 'Lipsa acestui header permite includerea site-ului în iframe-uri malițioase.'
        }
      ];

      const findings = securityChecks.map(check => ({
        header: check.header,
        present: !!headers[check.header],
        risk: !headers[check.header] ? check.risk : 'NONE',
        description: !headers[check.header] ? check.description : 'Configurare corectă.'
      }));

      return {
        url,
        status: response.status,
        findings
      };
    } catch (error: any) {
      return { url, error: error.message };
    }
  }
};
