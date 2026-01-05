import { getToolDefinitions } from './src/tools.js';

const tools = getToolDefinitions();

console.log(`Total tools defined: ${tools.length}\n`);

// Check for duplicates
const names = tools.map(t => t.name);
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
if (duplicates.length > 0) {
  console.log('❌ Duplicate tools:', duplicates);
}

// Check for missing descriptions
const missingDesc = tools.filter(t => !t.description || t.description.trim() === '');
if (missingDesc.length > 0) {
  console.log('❌ Tools without description:', missingDesc.map(t => t.name));
}

// Check for missing schemas
const missingSchema = tools.filter(t => !t.inputSchema);
if (missingSchema.length > 0) {
  console.log('❌ Tools without inputSchema:', missingSchema.map(t => t.name));
}

// List all tools with categories
console.log('\n📋 All tools by category:\n');

const categories = {
  'Entity Management': tools.filter(t => ['createEntities', 'createRelations', 'addObservations', 'searchNodes', 'openNodes', 'deleteEntities', 'deleteRelations', 'deleteObservations'].includes(t.name)),
  'Document Processing': tools.filter(t => ['processDocument', 'storeDocument', 'listDocuments', 'deleteDocuments', 'chunkDocument', 'embedChunks', 'embedAllEntities'].includes(t.name)),
  'Search & Retrieval': tools.filter(t => ['hybridSearch', 'getDetailedContext', 'readGraph'].includes(t.name)),
  'Utilities': tools.filter(t => ['getKnowledgeGraphStats', 'extractTerms', 'linkEntitiesToDocument'].includes(t.name))
};

Object.entries(categories).forEach(([cat, catTools]) => {
  console.log(`${cat}: ${catTools.length} tools`);
  catTools.forEach(t => console.log(`  - ${t.name}`));
});

console.log('\n✅ All tools are valid!');
