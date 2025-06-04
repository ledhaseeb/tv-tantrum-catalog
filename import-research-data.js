/**
 * Import Research Summaries with Proper Timestamp Conversion
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Convert timestamp strings to proper PostgreSQL format
 */
function convertTimestamp(timestampStr) {
  if (!timestampStr) return null;
  
  try {
    // Parse various timestamp formats
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.log(`Warning: Could not parse timestamp: ${timestampStr}`);
    return null;
  }
}

/**
 * Research summaries data
 */
const researchData = [
  {
    title: '2-Y/O Learning: Joint Media vs. Passive Viewing',
    summary: 'Comparing Two Forms of Joint Media Engagement With Passive Viewing and Learning From 3D" examines how 2-year-old children learn from two-dimensional (2D) media, such as videos, under different conditions.',
    full_text: 'The findings revealed that children learned best when they had direct interaction with physical objects (3D learning). Among the 2D media scenarios, those involving active parental support (both JME conditions) led to better learning outcomes compared to passive viewing. This suggests that while direct, hands-on experiences are most effective for learning at this age, engaging with 2D media can also be beneficial, especially when parents actively participate and provide guidance.\n\nIn summary: For 2-year-old children, direct interaction with real objects facilitates the most effective learning. However, when engaging with 2D media, active parental involvement enhances learning outcomes compared to passive viewing.',
    source: 'Frontiers in Psychology',
    published_date: '2021-01-21',
    category: 'Learning Outcomes',
    image_url: '/research/1748012164444-output(1).png',
    original_url: 'https://www.frontiersin.org/articles/10.3389/fpsyg.2021.623191/full',
    headline: '2-Y/O Learning: Joint Media vs. Passive Viewing',
    sub_headline: 'How parental engagement enhances learning from 2D media for toddlers',
    key_findings: 'Children watched a video without any interaction. Joint Media Engagement (JME) with Parental Support: Children watched the video with a parent who actively engaged with them, providing explanations and encouragement. JME with Parental Support and Additional Scaffolding: Similar to the second scenario, but with parents offering more structured guidance to enhance understanding. Learning from 3D Interaction: Children learned the same content through direct interaction with physical objects, without any media'
  },
  {
    title: 'Learning Between 2D and 3D Sources During Infancy',
    summary: 'Infants\' ability to transfer learning between 2D and 3D contexts is crucial for their cognitive development. Understanding how these early interactions shape learning can inform educational practices and parental guidance on media usage.',
    full_text: 'The findings emphasize the importance of minimizing passive screen time for infants and encouraging interactive learning environments. Parents can enhance learning transfer by co-viewing media with their children and linking screen content to real-world experiences.\n\nInfants learn less effectively from 2D sources compared to real-world 3D interactions, particularly before 2.5 years of age. The ability to transfer knowledge from 2D to 3D improves with age, with notable advancements after 2 years. Parental engagement, such as co-viewing and pointing out real-world applications of media content, improves infants\' ability to bridge the gap between 2D and 3D learning.',
    source: 'PubMed Central',
    published_date: '2010-06-01',
    category: 'Learning Outcomes',
    image_url: '/research/1748013917739-Untitled-2.png',
    original_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2885850/',
    headline: 'Learning Between 2D and 3D Sources During Infancy',
    sub_headline: 'The study explores how infants learn from two-dimensional (2D) representations and apply knowledge to real-world interactions',
    key_findings: 'Infants learn less effectively from 2D sources compared to real-world 3D interactions, particularly before 2.5 years of age. Developmental Trends: The ability to transfer knowledge from 2D to 3D improves with age, with notable advancements after 2 years. Enhancing Learning: Parental engagement, such as co-viewing and pointing out real-world applications of media content, improves infants\' ability to bridge the gap between 2D and 3D learning.'
  },
  {
    title: 'Media Content for Preschool Children',
    summary: 'Modifying Media Content for Preschool Children: A Randomized Controlled Trial" investigates whether altering the content of media consumed by preschool-aged children can influence their behavior, particularly in reducing aggression and enhancing prosocial behavior.',
    full_text: 'The findings suggest that modifying the content of media consumed by preschool children, emphasizing prosocial and educational programming, can lead to behavioral improvements, particularly in reducing aggression and enhancing social competence. This approach offers a viable strategy for parents and educators to positively influence child behavior without necessitating a reduction in overall screen time.',
    source: 'Pediatrics Online',
    published_date: '2013-03-01',
    category: 'Media Effects',
    image_url: '/research/1748082632998-output(3).png',
    original_url: 'https://pediatrics.aappublications.org/content/131/3/431',
    headline: 'Media Content for Preschool Children',
    sub_headline: 'How quality educational content can reduce aggression and improve social behavior',
    key_findings: 'Children in the intervention group exhibited a significant improvement in overall behavior scores at 6 months compared to the control group. Notable enhancements were observed in externalizing behaviors (e.g., reduced aggression) and social competence. Sustained Effects: While the positive effects persisted at 12 months, the statistical significance for externalizing behaviors diminished, suggesting a need for ongoing reinforcement. Subgroup Analysis: Low-income boys derived the greatest benefit from the intervention.'
  },
  {
    title: 'Language Disorders and Screen Exposure',
    summary: 'The study highlights the potential risks of screen exposure on children\'s language development, emphasizing the need for better parental interaction and public health guidelines to mitigate these effects.',
    full_text: 'The findings suggest that both the timing of screen exposure and the quality of parental interaction significantly impact language development. Health professionals should educate parents about limiting screen time and engaging children in discussions about screen content.',
    source: 'ACTA PAEDIATRICA',
    published_date: '2018-11-06',
    category: 'Learning Outcomes',
    image_url: '/research/1748083242250-output(4).png',
    original_url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/apa.14592',
    headline: 'Language Disorders and Screen Exposure',
    sub_headline: 'Morning screen time and lack of parental discussion increase language disorder risk',
    key_findings: 'Lack of Parental Discussion: Rarely or never discussing screen content with parents doubled the risk of language problems. Cumulative Effect: Combining morning screen exposure with a lack of parental discussion made children six times more likely to develop primary language disorders.'
  },
  {
    title: 'Development of Brain & Verbal Intelligence',
    summary: 'Understanding the long-term effects of frequent internet use during childhood is crucial, given the increasing integration of digital technology into daily life. This study provides insights into how internet usage may influence cognitive development and brain structure maturation.',
    full_text: 'The findings suggest that frequent internet use during critical developmental periods may negatively impact verbal intelligence and brain maturation. These results underscore the importance of monitoring and potentially moderating children\'s internet usage to support healthy cognitive and neural development.',
    source: 'PubMed Central',
    published_date: '2018-06-30',
    category: 'Learning Outcomes',
    image_url: '/research/1748083654390-Untitled.png',
    original_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6866412/',
    headline: 'Development of Brain & Verbal Intelligence',
    sub_headline: 'Impact of frequent internet use on cognitive development and brain structure',
    key_findings: 'Children with higher frequencies of internet use exhibited a decline in verbal intelligence over a few years. Reduced Brain Volume Growth: Increased internet use was associated with smaller increases in both gray and white matter volumes in various brain regions, including those related to language processing, attention, executive functions, emotion, and reward.'
  }
];

/**
 * Import research summaries into database
 */
async function importResearchData() {
  try {
    console.log('Starting research summaries import...');
    
    // Clear existing data
    await pool.query('DELETE FROM research_summaries');
    console.log('Cleared existing research summaries');
    
    let successCount = 0;
    
    for (const research of researchData) {
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
        
        console.log(`✓ Imported: ${research.title} (ID: ${result.rows[0].id})`);
        successCount++;
        
      } catch (error) {
        console.error(`Error importing ${research.title}:`, error.message);
      }
    }
    
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Successfully imported: ${successCount}/${researchData.length} research summaries`);
    
    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) FROM research_summaries');
    console.log(`Total research summaries in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importResearchData();