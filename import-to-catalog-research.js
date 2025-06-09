/**
 * Import Research Summaries to Catalog Table
 * Imports all research data to catalog_research_summaries table
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Transfer data from research_summaries to catalog_research_summaries
 */
async function transferToCatalogTable() {
  try {
    console.log('Transferring research data to catalog table...');
    
    // Clear existing catalog data
    await pool.query('DELETE FROM catalog_research_summaries');
    console.log('Cleared existing catalog research summaries');
    
    // Get all data from research_summaries
    const result = await pool.query(`
      SELECT title, summary, full_text, source, published_date, 
             category, image_url, original_url, headline, 
             sub_headline, key_findings
      FROM research_summaries 
      ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} research summaries to transfer`);
    
    let successCount = 0;
    
    for (const research of result.rows) {
      try {
        const insertResult = await pool.query(`
          INSERT INTO catalog_research_summaries (
            title, summary, full_text, category, image_url, source, 
            original_url, published_date, headline, sub_headline, 
            key_findings, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id
        `, [
          research.title,
          research.summary,
          research.full_text,
          research.category,
          research.image_url,
          research.source,
          research.original_url,
          research.published_date,
          research.headline,
          research.sub_headline,
          research.key_findings
        ]);
        
        console.log(`✓ Transferred: ${research.title} (ID: ${insertResult.rows[0].id})`);
        successCount++;
        
      } catch (error) {
        console.error(`Error transferring ${research.title}:`, error.message);
      }
    }
    
    console.log(`\n=== TRANSFER COMPLETE ===`);
    console.log(`Successfully transferred: ${successCount} research summaries`);
    
    // Verify final count in catalog table
    const countResult = await pool.query('SELECT COUNT(*) FROM catalog_research_summaries');
    console.log(`Total in catalog_research_summaries: ${countResult.rows[0].count}`);
    
    // Show categories in catalog table
    const categoriesResult = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM catalog_research_summaries 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('\nCategories in catalog:');
    categoriesResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} summaries`);
    });
    
  } catch (error) {
    console.error('Fatal error during transfer:', error);
  } finally {
    await pool.end();
  }
}

// Run the transfer
transferToCatalogTable();