import { eq } from 'drizzle-orm';
import { db, pool } from './db';
import { researchSummaries, userReadResearch } from '@shared/schema';

export async function updateResearchSummary(id: number, data: any) {
  try {
    console.log(`Updating research summary ${id} with data:`, data);
    
    // Make sure to include the updated timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Update the research summary using direct SQL for reliability
    const result = await pool.query(
      `UPDATE research_summaries 
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           full_text = COALESCE($3, full_text),
           category = COALESCE($4, category),
           image_url = COALESCE($5, image_url),
           source = COALESCE($6, source),
           original_url = COALESCE($7, original_url),
           published_date = COALESCE($8, published_date),
           headline = COALESCE($9, headline),
           sub_headline = COALESCE($10, sub_headline),
           key_findings = COALESCE($11, key_findings),
           updated_at = $12
       WHERE id = $13
       RETURNING *`,
      [
        data.title,
        data.summary,
        data.fullText,
        data.category,
        data.imageUrl,
        data.source,
        data.originalUrl,
        data.publishedDate,
        data.headline,
        data.subHeadline,
        data.keyFindings,
        updateData.updatedAt,
        id
      ]
    );
    
    if (result.rowCount === 0) {
      console.error(`No research summary found with id ${id}`);
      return null;
    }
    
    // Convert snake_case to camelCase for response
    const updatedSummary = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      summary: result.rows[0].summary,
      fullText: result.rows[0].full_text,
      category: result.rows[0].category,
      imageUrl: result.rows[0].image_url,
      source: result.rows[0].source,
      originalUrl: result.rows[0].original_url,
      publishedDate: result.rows[0].published_date,
      headline: result.rows[0].headline,
      subHeadline: result.rows[0].sub_headline,
      keyFindings: result.rows[0].key_findings,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    return updatedSummary;
  } catch (error) {
    console.error('Error updating research summary:', error);
    throw error;
  }
}

export async function deleteResearchSummary(id: number) {
  try {
    console.log(`Deleting research summary ${id}`);
    
    // First delete any associated read records
    await pool.query('DELETE FROM user_read_research WHERE research_id = $1', [id]);
    
    // Then delete the research summary
    const result = await pool.query('DELETE FROM research_summaries WHERE id = $1 RETURNING id', [id]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting research summary:', error);
    throw error;
  }
}
