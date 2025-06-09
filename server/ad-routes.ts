import { Router } from 'express';
import { db } from './db';
import { ads, adTracking, insertAdTrackingSchema } from '@shared/schema';
import { eq, and, gte, lte, or, isNull, sql } from 'drizzle-orm';

const router = Router();

// Get ad for specific placement
router.get('/ads', async (req, res) => {
  try {
    const { placement } = req.query;
    
    if (!placement || typeof placement !== 'string') {
      return res.status(400).json({ error: 'Placement is required' });
    }

    const now = new Date();
    
    // Find active ad for the placement
    const activeAds = await db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.placement, placement),
          eq(ads.isActive, true)
        )
      )
      .limit(1);

    if (activeAds.length === 0) {
      return res.status(404).json({ error: 'No active ads found for this placement' });
    }

    // Map database fields to frontend expected format
    const ad = activeAds[0];
    const mappedAd = {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.image_url,
      ctaText: ad.cta_text,
      targetUrl: ad.target_url,
      placement: ad.placement,
      isActive: ad.is_active,
    };
    
    res.json(mappedAd);
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

// Track ad interactions
router.post('/ads/track', async (req, res) => {
  try {
    const trackingData = insertAdTrackingSchema.parse(req.body);
    
    // Get user agent and IP for tracking
    const userAgent = req.get('User-Agent') || null;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    // Insert tracking record
    await db.insert(adTracking).values({
      ...trackingData,
      userAgent,
      ipAddress,
    });

    // Update ad counters
    if (trackingData.action === 'impression') {
      await db
        .update(ads)
        .set({
          currentImpressions: db.raw('current_impressions + 1'),
          updatedAt: new Date(),
        })
        .where(eq(ads.id, trackingData.adId));
    } else if (trackingData.action === 'click') {
      await db
        .update(ads)
        .set({
          currentClicks: db.raw('current_clicks + 1'),
          updatedAt: new Date(),
        })
        .where(eq(ads.id, trackingData.adId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking ad:', error);
    res.status(500).json({ error: 'Failed to track ad interaction' });
  }
});

// Admin routes for managing ads
router.get('/admin/ads', async (req, res) => {
  try {
    const allAds = await db.select().from(ads).orderBy(ads.createdAt);
    res.json(allAds);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

router.post('/admin/ads', async (req, res) => {
  try {
    const adData = req.body;
    
    const [newAd] = await db.insert(ads).values({
      ...adData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.json(newAd);
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

router.put('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adData = req.body;
    
    const [updatedAd] = await db
      .update(ads)
      .set({
        ...adData,
        updatedAt: new Date(),
      })
      .where(eq(ads.id, parseInt(id)))
      .returning();

    res.json(updatedAd);
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

router.delete('/admin/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(ads).where(eq(ads.id, parseInt(id)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

export default router;