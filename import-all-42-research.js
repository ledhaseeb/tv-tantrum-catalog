/**
 * Import All 42 Research Summaries from SQL File
 * Parses the complete SQL file and imports all research data
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Parse SQL VALUES statement more reliably
 */
function parseInsertValues(sqlContent) {
  const summaries = [];
  
  // Find all INSERT statements
  const insertRegex = /INSERT INTO research_summaries[^;]*VALUES\s*\((.*?)\);/gs;
  let match;
  
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const valuesStr = match[1];
    const values = parseValuesList(valuesStr);
    
    if (values.length >= 13) {
      summaries.push({
        title: cleanValue(values[0]),
        summary: cleanValue(values[1]),
        full_text: cleanValue(values[2]),
        source: cleanValue(values[3]),
        published_date: cleanValue(values[4]),
        category: cleanValue(values[6]),
        image_url: cleanValue(values[7]),
        original_url: cleanValue(values[9]),
        headline: cleanValue(values[10]),
        sub_headline: cleanValue(values[11]),
        key_findings: cleanValue(values[12])
      });
    }
  }
  
  return summaries;
}

/**
 * Parse comma-separated values accounting for quoted strings
 */
function parseValuesList(valuesStr) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;
  let depth = 0;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const nextChar = valuesStr[i + 1];
    
    // Handle escaped quotes
    if (char === '\\' && (nextChar === "'" || nextChar === '"')) {
      current += char + nextChar;
      i++; // Skip next char
      continue;
    }
    
    // Handle quote boundaries
    if (!inQuotes && (char === "'" || char === '"')) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }
    
    if (inQuotes && char === quoteChar) {
      // Check if this is an escaped quote
      if (nextChar === quoteChar) {
        current += char;
        i++; // Skip next char
        continue;
      }
      inQuotes = false;
      quoteChar = null;
      continue;
    }
    
    // Handle parentheses for nested structures
    if (!inQuotes) {
      if (char === '(') depth++;
      if (char === ')') depth--;
    }
    
    // Handle commas at top level
    if (!inQuotes && depth === 0 && char === ',') {
      values.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  // Add the last value
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

/**
 * Clean and normalize values
 */
function cleanValue(value) {
  if (!value || value === 'NULL') return null;
  
  return value
    .replace(/^['"]|['"]$/g, '') // Remove outer quotes
    .replace(/''/g, "'") // Unescape single quotes
    .replace(/\\'/g, "'") // Unescape backslash quotes
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Import all research summaries
 */
async function importAllResearchSummaries() {
  try {
    console.log('Reading SQL file...');
    const sqlContent = fs.readFileSync('attached_assets/research-summaries-import.sql', 'utf-8');
    
    console.log('Parsing research summaries...');
    const summaries = parseInsertValues(sqlContent);
    
    console.log(`Found ${summaries.length} research summaries to import`);
    
    if (summaries.length === 0) {
      console.error('No summaries found in SQL file');
      return;
    }
    
    // Clear existing data
    await pool.query('DELETE FROM research_summaries');
    console.log('Cleared existing research summaries');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < summaries.length; i++) {
      const research = summaries[i];
      
      try {
        const result = await pool.query(`
          INSERT INTO research_summaries (
            title, summary, full_text, source, published_date, 
            category, image_url, original_url, headline, 
            sub_headline, key_findings, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id
        `, [
          research.title,
          research.summary,
          research.full_text,
          research.source,
          research.published_date,
          research.category,
          research.image_url,
          research.original_url,
          research.headline,
          research.sub_headline,
          research.key_findings
        ]);
        
        console.log(`✓ ${i + 1}/${summaries.length} - ${research.title} (ID: ${result.rows[0].id})`);
        successCount++;
        
      } catch (error) {
        console.error(`✗ ${i + 1}/${summaries.length} - Error importing ${research.title}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Successfully imported: ${successCount} research summaries`);
    console.log(`Errors: ${errorCount}`);
    
    // Verify final count
    const countResult = await pool.query('SELECT COUNT(*) FROM research_summaries');
    console.log(`Total research summaries in database: ${countResult.rows[0].count}`);
    
    // Show categories
    const categoriesResult = await pool.query('SELECT DISTINCT category, COUNT(*) as count FROM research_summaries GROUP BY category ORDER BY category');
    console.log('\nCategories:');
    categoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} summaries`);
    });
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importAllResearchSummaries();