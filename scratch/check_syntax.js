const parser = require('@babel/parser');
const fs = require('fs');
const content = fs.readFileSync('d:/A Done Projects - N8N - Veo3 - Agents/Apps/Projects/Coding/MAXX_App/frontend/app/(tabs)/focus.tsx', 'utf8');
try {
  parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('Valid syntax');
} catch (e) {
  console.error('Syntax error:', e.message);
  console.error('At line:', e.loc.line, 'column:', e.loc.column);
}
