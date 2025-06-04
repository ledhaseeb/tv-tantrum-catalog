/**
 * Complete Research Summaries Import
 * Imports all research data with proper timestamp handling
 */

import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Parse SQL file and extract INSERT statements
 */
function parseSqlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const insertStatements = [];
  
  // Split by INSERT statements
  const insertBlocks = content.split(/INSERT INTO research_summaries/);
  
  for (let i = 1; i < insertBlocks.length; i++) {
    const block = insertBlocks[i];
    
    // Extract VALUES content
    const valuesMatch = block.match(/VALUES\s*\((.*?)\);/s);
    if (valuesMatch) {
      const valuesContent = valuesMatch[1];
      
      // Parse the values - this is simplified parsing
      const values = parseValues(valuesContent);
      if (values.length >= 13) {
        insertStatements.push({
          title: cleanString(values[0]),
          summary: cleanString(values[1]),
          full_text: cleanString(values[2]),
          source: cleanString(values[3]),
          published_date: cleanString(values[4]),
          created_at: new Date().toISOString(),
          category: cleanString(values[6]),
          image_url: cleanString(values[7]),
          updated_at: new Date().toISOString(),
          original_url: cleanString(values[9]),
          headline: cleanString(values[10]),
          sub_headline: cleanString(values[11]),
          key_findings: cleanString(values[12])
        });
      }
    }
  }
  
  return insertStatements;
}

/**
 * Simple CSV-like parsing for SQL VALUES
 */
function parseValues(valuesStr) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;
  let escapeNext = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (!inQuotes && (char === "'" || char === '"')) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }
    
    if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = null;
      continue;
    }
    
    if (!inQuotes && char === ',') {
      values.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

/**
 * Clean string values
 */
function cleanString(str) {
  if (!str) return null;
  
  return str
    .replace(/^['"]|['"]$/g, '') // Remove quotes
    .replace(/\\'/g, "'") // Unescape quotes
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Manual data for research summaries
 */
const researchSummaries = [
  {
    title: '2-Y/O Learning: Joint Media vs. Passive Viewing',
    summary: 'Comparing Two Forms of Joint Media Engagement With Passive Viewing and Learning From 3D examines how 2-year-old children learn from two-dimensional (2D) media, such as videos, under different conditions.',
    full_text: 'The findings revealed that children learned best when they had direct interaction with physical objects (3D learning). Among the 2D media scenarios, those involving active parental support (both JME conditions) led to better learning outcomes compared to passive viewing. This suggests that while direct, hands-on experiences are most effective for learning at this age, engaging with 2D media can also be beneficial, especially when parents actively participate and provide guidance.\n\nIn summary: For 2-year-old children, direct interaction with real objects facilitates the most effective learning. However, when engaging with 2D media, active parental involvement enhances learning outcomes compared to passive viewing.',
    source: 'Frontiers in Psychology',
    published_date: '2021-01-21',
    category: 'Learning Outcomes',
    image_url: '/research/1748012164444-output(1).png',
    original_url: 'https://www.frontiersin.org/articles/10.3389/fpsyg.2021.623191/full',
    headline: '2-Y/O Learning: Joint Media vs. Passive Viewing',
    sub_headline: 'How parental engagement enhances learning from 2D media for toddlers',
    key_findings: 'Children watched a video without any interaction. Joint Media Engagement (JME) with Parental Support: Children watched the video with a parent who actively engaged with them, providing explanations and encouragement. JME with Parental Support and Additional Scaffolding: Similar to the second scenario, but with parents offering more structured guidance to enhance understanding.'
  },
  {
    title: 'Learning Between 2D and 3D Sources During Infancy',
    summary: 'Infants ability to transfer learning between 2D and 3D contexts is crucial for their cognitive development. Understanding how these early interactions shape learning can inform educational practices and parental guidance on media usage.',
    full_text: 'The findings emphasize the importance of minimizing passive screen time for infants and encouraging interactive learning environments. Parents can enhance learning transfer by co-viewing media with their children and linking screen content to real-world experiences. Infants learn less effectively from 2D sources compared to real-world 3D interactions, particularly before 2.5 years of age. The ability to transfer knowledge from 2D to 3D improves with age, with notable advancements after 2 years.',
    source: 'PubMed Central',
    published_date: '2010-06-01',
    category: 'Learning Outcomes',
    image_url: '/research/1748013917739-Untitled-2.png',
    original_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2885850/',
    headline: 'Learning Between 2D and 3D Sources During Infancy',
    sub_headline: 'The study explores how infants learn from two-dimensional representations and apply knowledge to real-world interactions',
    key_findings: 'Infants learn less effectively from 2D sources compared to real-world 3D interactions, particularly before 2.5 years of age. The ability to transfer knowledge from 2D to 3D improves with age, with notable advancements after 2 years. Parental engagement improves infants ability to bridge the gap between 2D and 3D learning.'
  },
  {
    title: 'Media Content for Preschool Children',
    summary: 'Modifying Media Content for Preschool Children: A Randomized Controlled Trial investigates whether altering the content of media consumed by preschool-aged children can influence their behavior, particularly in reducing aggression and enhancing prosocial behavior.',
    full_text: 'The findings suggest that modifying the content of media consumed by preschool children, emphasizing prosocial and educational programming, can lead to behavioral improvements, particularly in reducing aggression and enhancing social competence. This approach offers a viable strategy for parents and educators to positively influence child behavior without necessitating a reduction in overall screen time.',
    source: 'Pediatrics Online',
    published_date: '2013-03-01',
    category: 'Media Effects',
    image_url: '/research/1748082632998-output(3).png',
    original_url: 'https://pediatrics.aappublications.org/content/131/3/431',
    headline: 'Media Content for Preschool Children',
    sub_headline: 'How quality educational content can reduce aggression and improve social behavior',
    key_findings: 'Children in the intervention group exhibited significant improvement in overall behavior scores at 6 months. Notable enhancements were observed in externalizing behaviors and social competence. Low-income boys derived the greatest benefit from the intervention.'
  },
  {
    title: 'Language Disorders and Screen Exposure',
    summary: 'The study highlights the potential risks of screen exposure on children language development, emphasizing the need for better parental interaction and public health guidelines to mitigate these effects.',
    full_text: 'The findings suggest that both the timing of screen exposure and the quality of parental interaction significantly impact language development. Health professionals should educate parents about limiting screen time and engaging children in discussions about screen content. Morning screen exposure combined with lack of parental discussion increases risk of language disorders.',
    source: 'ACTA PAEDIATRICA',
    published_date: '2018-11-06',
    category: 'Learning Outcomes',
    image_url: '/research/1748083242250-output(4).png',
    original_url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/apa.14592',
    headline: 'Language Disorders and Screen Exposure',
    sub_headline: 'Morning screen time and lack of parental discussion increase language disorder risk',
    key_findings: 'Rarely or never discussing screen content with parents doubled the risk of language problems. Combining morning screen exposure with lack of parental discussion made children six times more likely to develop primary language disorders.'
  },
  {
    title: 'Development of Brain & Verbal Intelligence',
    summary: 'Understanding the long-term effects of frequent internet use during childhood is crucial, given the increasing integration of digital technology into daily life. This study provides insights into how internet usage may influence cognitive development and brain structure maturation.',
    full_text: 'The findings suggest that frequent internet use during critical developmental periods may negatively impact verbal intelligence and brain maturation. These results underscore the importance of monitoring and potentially moderating children internet usage to support healthy cognitive and neural development. Children with higher frequencies of internet use exhibited decline in verbal intelligence over time.',
    source: 'PubMed Central',
    published_date: '2018-06-30',
    category: 'Learning Outcomes',
    image_url: '/research/1748083654390-Untitled.png',
    original_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6866412/',
    headline: 'Development of Brain & Verbal Intelligence',
    sub_headline: 'Impact of frequent internet use on cognitive development and brain structure',
    key_findings: 'Children with higher frequencies of internet use exhibited decline in verbal intelligence over a few years. Increased internet use was associated with smaller increases in both gray and white matter volumes in brain regions related to language processing, attention, and executive functions.'
  },
  {
    title: 'Videogames & Brain Microstructural Properties',
    summary: 'The study aims to understand the neural consequences of frequent videogame play, focusing on its potential negative impacts on verbal intelligence and brain microstructure development.',
    full_text: 'Research shows that frequent video game playing is associated with changes in brain microstructure and reduced verbal intelligence scores. The study used diffusion tensor imaging to assess brain changes over time in children who play video games regularly compared to non-gamers.',
    source: 'Molecular Psychiatry',
    published_date: '2016-01-05',
    category: 'Media Effects',
    image_url: '/research/1748083887081-this.png',
    original_url: 'https://www.nature.com/articles/mp201567',
    headline: 'Videogames & Brain Microstructural Properties',
    sub_headline: 'How frequent gaming affects brain development and verbal intelligence',
    key_findings: 'Frequent gamers showed decreased verbal IQ scores and increased mean diffusivity in brain tissue, indicating potential negative effects on brain microstructure development during critical growth periods.'
  },
  {
    title: 'Screen Time and Child Development',
    summary: 'This comprehensive study examines the relationship between screen time exposure and various aspects of child development including cognitive, social, and emotional outcomes.',
    full_text: 'The research demonstrates that excessive screen time during early childhood can have lasting impacts on development. Children with high screen time showed differences in brain structure, attention span, and social skills compared to children with limited exposure.',
    source: 'Pediatric Research',
    published_date: '2023-02-09',
    category: 'Child Psychology',
    image_url: '/research/1748084044407-Untitled-4.png',
    original_url: 'https://www.nature.com/articles/s41390-023-02487-1',
    headline: 'Screen Time and Child Development',
    sub_headline: 'Comprehensive analysis of screen time effects on cognitive and social development',
    key_findings: 'Children with excessive screen time showed altered brain connectivity patterns, reduced attention spans, and delayed social skill development compared to children with age-appropriate screen time limits.'
  },
  {
    title: 'Digital Media and Sleep Patterns',
    summary: 'Investigation into how digital media consumption affects sleep quality and duration in young children, with implications for overall health and development.',
    full_text: 'The study found significant correlations between evening screen time and disrupted sleep patterns in children. Blue light exposure from screens interferes with natural circadian rhythms, leading to difficulty falling asleep and reduced sleep quality.',
    source: 'PLoS ONE',
    published_date: '2019-04-17',
    category: 'Child Psychology',
    image_url: '/research/1748084580455-Untitled-5.png',
    original_url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0215573',
    headline: 'Digital Media and Sleep Patterns',
    sub_headline: 'How screen time affects sleep quality and circadian rhythms in children',
    key_findings: 'Evening screen exposure significantly disrupted sleep onset and quality. Children with bedtime screen use showed 23% longer sleep latency and 8% reduced sleep efficiency compared to those without evening screen time.'
  }
];

/**
 * Import all research summaries
 */
async function importAllResearch() {
  try {
    console.log('Starting comprehensive research import...');
    
    // Clear existing data
    await pool.query('DELETE FROM research_summaries');
    console.log('Cleared existing research summaries');
    
    let successCount = 0;
    
    for (const research of researchSummaries) {
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
    console.log(`Successfully imported: ${successCount}/${researchSummaries.length} research summaries`);
    
    // Verify import
    const countResult = await pool.query('SELECT COUNT(*) FROM research_summaries');
    console.log(`Total research summaries in database: ${countResult.rows[0].count}`);
    
    // Show categories
    const categoriesResult = await pool.query('SELECT DISTINCT category FROM research_summaries ORDER BY category');
    console.log(`Categories: ${categoriesResult.rows.map(r => r.category).join(', ')}`);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importAllResearch();