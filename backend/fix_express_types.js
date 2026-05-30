const fs = require('fs');
const path = require('path');
const controllersDir = path.join(__dirname, 'src', 'controllers');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace req.params and req.query with (req.params as any) and (req.query as any)
            let modified = content.replace(/\breq\.params\b/g, '(req.params as any)');
            modified = modified.replace(/\breq\.query\b/g, '(req.query as any)');
            
            // Revert any accidental double wraps if there were any
            modified = modified.replace(/\(\(req\.params as any\)\)/g, '(req.params as any)');
            modified = modified.replace(/\(\(req\.query as any\)\)/g, '(req.query as any)');
            modified = modified.replace(/\(\(req\.params as any\) as any\)/g, '(req.params as any)');
            modified = modified.replace(/\(\(req\.query as any\) as any\)/g, '(req.query as any)');

            if (content !== modified) {
                fs.writeFileSync(fullPath, modified, 'utf8');
                console.log('Fixed types in ' + file);
            }
        }
    }
}

processDir(controllersDir);
