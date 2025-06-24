const fs = require('fs');
const path = require('path');

// Diretório raiz das rotas de API
const apiDir = path.join(__dirname, '../app/api');

// Função para adicionar a diretiva dynamic = 'force-dynamic' a um arquivo
function addDynamicDirective(filePath) {
  try {
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se o arquivo já tem a diretiva
    if (content.includes('export const dynamic = \'force-dynamic\'')) {
      console.log(`✅ Arquivo já tem a diretiva: ${filePath}`);
      return;
    }
    
    // Encontrar a primeira importação ou o início do arquivo
    const importRegex = /^import .+$/m;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      // Adicionar a diretiva após a última importação
      const lastImportIndex = content.lastIndexOf('import');
      const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
      
      if (lastImportLineEnd !== -1) {
        const newContent = 
          content.slice(0, lastImportLineEnd + 1) + 
          '\n// Forçar renderização dinâmica para evitar problemas de 404\nexport const dynamic = \'force-dynamic\';\nexport const fetchCache = \'force-no-store\';\nexport const revalidate = 0;\n' + 
          content.slice(lastImportLineEnd + 1);
        
        // Escrever o conteúdo modificado de volta para o arquivo
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Adicionada diretiva ao arquivo: ${filePath}`);
      }
    } else {
      // Adicionar a diretiva no início do arquivo
      const newContent = 
        '// Forçar renderização dinâmica para evitar problemas de 404\nexport const dynamic = \'force-dynamic\';\nexport const fetchCache = \'force-no-store\';\nexport const revalidate = 0;\n\n' + 
        content;
      
      // Escrever o conteúdo modificado de volta para o arquivo
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Adicionada diretiva ao arquivo: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar o arquivo ${filePath}:`, error);
  }
}

// Função para percorrer recursivamente os diretórios
function processDirectory(dirPath) {
  // Ler o conteúdo do diretório
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Se for um diretório, processar recursivamente
      processDirectory(itemPath);
    } else if (stats.isFile() && item === 'route.ts' || item === 'route.js') {
      // Se for um arquivo de rota, adicionar a diretiva
      addDynamicDirective(itemPath);
    }
  }
}

// Iniciar o processamento
console.log('Iniciando processamento das rotas de API...');
processDirectory(apiDir);
console.log('Processamento concluído!'); 