const fs = require('fs');
const path = require('path');

// Diretório raiz das páginas
const pagesDir = path.join(__dirname, '../app');

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
    
    // Verificar se o arquivo usa cookies ou outros recursos dinâmicos
    const usesDynamicFeatures = 
      content.includes('cookies') || 
      content.includes('headers') || 
      content.includes('request.url') || 
      content.includes('searchParams');
    
    if (!usesDynamicFeatures) {
      console.log(`⏭️ Arquivo não usa recursos dinâmicos: ${filePath}`);
      return;
    }
    
    // Encontrar o início do arquivo ou após as importações
    const importRegex = /^import .+$/m;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      // Encontrar a última importação
      const lastImportIndex = content.lastIndexOf('import');
      const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
      
      if (lastImportLineEnd !== -1) {
        const newContent = 
          content.slice(0, lastImportLineEnd + 1) + 
          '\n// Forçar renderização dinâmica para evitar problemas com cookies\nexport const dynamic = \'force-dynamic\';\n' + 
          content.slice(lastImportLineEnd + 1);
        
        // Escrever o conteúdo modificado de volta para o arquivo
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Adicionada diretiva ao arquivo: ${filePath}`);
      }
    } else {
      // Adicionar a diretiva no início do arquivo
      const newContent = 
        '// Forçar renderização dinâmica para evitar problemas com cookies\nexport const dynamic = \'force-dynamic\';\n\n' + 
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
    } else if (stats.isFile() && (item === 'page.tsx' || item === 'page.js')) {
      // Se for um arquivo de página, adicionar a diretiva
      addDynamicDirective(itemPath);
    }
  }
}

// Iniciar o processamento
console.log('Iniciando processamento das páginas...');
processDirectory(pagesDir);
console.log('Processamento concluído!'); 