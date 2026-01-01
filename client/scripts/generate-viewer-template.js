import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist-viewer');
const templateDir = path.join(__dirname, '../../node-service/templates');
const outputPath = path.join(templateDir, 'viewer.html');

// Ensure template directory exists
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

// Read built files
const files = fs.readdirSync(distDir);
const jsFile = files.find(f => f.endsWith('.js'));
const cssFile = files.find(f => f.endsWith('.css'));

if (!jsFile) {
  console.error('❌ No JavaScript bundle found in dist-viewer/');
  console.error('   Make sure to run "npm run build:viewer" first');
  process.exit(1);
}

console.log('📦 Reading built files...');
console.log('   JS:', jsFile);
if (cssFile) console.log('   CSS:', cssFile);

const jsContent = fs.readFileSync(path.join(distDir, jsFile), 'utf-8');
const cssContent = cssFile
  ? fs.readFileSync(path.join(distDir, cssFile), 'utf-8')
  : '';

// Generate HTML template with placeholders
const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{MAP_NAME}} - Principle Concept Map</title>
  <meta name="description" content="{{MAP_DESCRIPTION}}">

  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="{{MAP_NAME}}">
  <meta property="og:description" content="{{MAP_DESCRIPTION}}">
  <meta property="og:type" content="website">

  <style>
/* Viewer Styles */
${cssContent}

/* Additional utilities */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Data Placeholder - Server will inject data here -->
  <script>
    // DATA_INJECTION_POINT
    window.CONCEPT_MAP_DATA = null;
  </script>

  <!-- Viewer Application Bundle -->
  <script>
${jsContent}
  </script>
</body>
</html>
`;

// Write template
fs.writeFileSync(outputPath, template, 'utf-8');

console.log('✅ Viewer template generated successfully!');
console.log('   Location:', outputPath);
console.log('   Size:', Math.round(template.length / 1024), 'KB');
console.log('   Next: Run "npm run dev" in node-service to use it');
