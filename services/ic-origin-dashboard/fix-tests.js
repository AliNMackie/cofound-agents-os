const fs = require('fs');
const path = require('path');

const d = './e2e';
const files = fs.readdirSync(d).filter(f => /^0[3-9]|^1[0-4]/.test(f) && f.endsWith('.ts'));

for (const f of files) {
    const p = path.join(d, f);
    let txt = fs.readFileSync(p, 'utf8');
    if (!txt.includes('setupAuthenticatedPage')) {
        txt = "import { setupAuthenticatedPage } from './helpers/auth';\n" + txt;
        // Replace the first occurrence of test.beforeEach(async ({ page }) => {
        txt = txt.replace(/test\.beforeEach\(async \(\{ page \}\) => \{/, "test.beforeEach(async ({ page }) => {\n        await setupAuthenticatedPage(page);\n");
        fs.writeFileSync(p, txt);
        console.log("Patched " + f);
    }
}
