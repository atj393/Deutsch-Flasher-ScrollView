// addCategoryLevel.js - Script to add empty category and level properties to German words
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'src', 'data', 'initialWords.json');
const backupFile = path.join(__dirname, 'src', 'data', 'initialWords_beforeCategoryLevel.json');

console.log('📚 German Words Property Enhancer');
console.log('=================================');

try {
  // Read the original file
  console.log('📖 Reading words file...');
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const words = JSON.parse(rawData);
  
  console.log(`✅ Loaded ${words.length} words`);
  
  // Create backup
  console.log('💾 Creating backup...');
  fs.writeFileSync(backupFile, rawData);
  console.log('✅ Backup created: initialWords_beforeCategoryLevel.json');
  
  // Add empty category and level properties to each word
  console.log('🔄 Adding empty category and level properties...');
  
  const enhancedWords = words.map((word) => {
    return {
      ...word,
      category: "",
      level: ""
    };
  });
  
  console.log('✅ Properties added successfully');
  
  // Write enhanced data back to file
  console.log('💾 Writing enhanced data...');
  const enhancedJson = JSON.stringify(enhancedWords, null, 2);
  fs.writeFileSync(inputFile, enhancedJson);
  
  console.log('✅ File updated successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Total words: ${enhancedWords.length}`);
  console.log(`   Added properties: category (empty), level (empty)`);
  console.log('');
  console.log('🎉 Enhancement complete!');
  console.log('💡 Backup saved as: initialWords_beforeCategoryLevel.json');
  console.log('');
  console.log('📝 Note: All category and level fields are empty strings.');
  console.log('   You can now manually categorize words as needed.');
  
} catch (error) {
  console.error('❌ Error occurred:', error.message);
  process.exit(1);
}