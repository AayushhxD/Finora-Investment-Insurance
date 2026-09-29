const fs = require('fs');
const path = require('path');

const files = [
  'components/applications/application-list.tsx',
  'components/applications/application-detail.tsx',
  'components/customers/customer-list.tsx',
  'components/customers/customer-detail.tsx',
  'components/staff/staff-client.tsx',
  'components/renewals/renewals-client.tsx',
  'components/referrals/referrals-client.tsx',
  'components/portal/portal-home.tsx',
  'components/notifications/notifications-client.tsx',
  'components/messages/messages-client.tsx',
  'components/leads/leads-client.tsx',
  'components/documents/documents-client.tsx'
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (content.includes('toLocaleDateString')) {
      if (!content.includes("from '@backend/lib/fmt-date'")) {
        // If there's 'use client', put import after it
        if (content.match(/^['"]use client['"]/m)) {
          content = content.replace(/^(['"]use client['"]\r?\n)/m, `$1import { fmtDate } from '@backend/lib/fmt-date'\n`);
        } else {
          content = `import { fmtDate } from '@backend/lib/fmt-date'\n` + content;
        }
      }
      content = content.replace(/new Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)/g, 'fmtDate($1)');
      fs.writeFileSync(p, content, 'utf8');
      console.log('Fixed', f);
    }
  }
});
