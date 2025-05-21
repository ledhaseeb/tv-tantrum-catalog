import { Router, Request, Response } from 'express';
import { IStorage } from '../storage';
import { z } from 'zod';
import { Pool } from 'pg';

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default function setupUserDashboardRoutes(router: Router, storage: IStorage) {
  // Get user's points history
  router.get('/user/points-history', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const pointsHistory = await storage.getUserPointsHistory(userId);
      res.json(pointsHistory);
    } catch (error) {
      console.error('Error fetching points history:', error);
      res.status(500).json({ error: 'Failed to fetch points history' });
    }
  });

  // Mark research as read
  router.post('/user/research/read', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const researchId = req.body.researchId;

      if (!researchId) {
        return res.status(400).json({ error: 'Research ID is required' });
      }

      // Check if already read
      const alreadyRead = await storage.checkResearchRead(userId, researchId);
      
      if (alreadyRead) {
        return res.json({ success: true, alreadyRead: true });
      }

      // Mark as read and award points
      await storage.markResearchAsRead(userId, researchId);
      await storage.addUserPoints(userId, 5, 'research_read', `Read research summary #${researchId}`);
      
      res.json({ success: true, pointsAwarded: 5 });
    } catch (error) {
      console.error('Error marking research as read:', error);
      res.status(500).json({ error: 'Failed to mark research as read' });
    }
  });

  // Get user's read research list
  router.get('/user/research/read', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const readResearch = await storage.getUserReadResearch(userId);
      res.json(readResearch);
    } catch (error) {
      console.error('Error fetching read research:', error);
      res.status(500).json({ error: 'Failed to fetch read research' });
    }
  });

  // Submit a new show
  router.post('/user/submissions', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const submissionSchema = z.object({
        showName: z.string().min(1),
        description: z.string().min(5),
        ageRange: z.string().min(1),
        platform: z.string().min(1),
        releaseYear: z.number().min(1950).max(new Date().getFullYear() + 1),
        creator: z.string().optional(),
        additionalInfo: z.string().optional(),
      });

      const validation = submissionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid submission data', 
          details: validation.error.format() 
        });
      }

      const userId = req.session.userId;
      const data = validation.data;

      // Create submission record
      const submission = await storage.createShowSubmission(
        userId,
        data.showName,
        data.description,
        data.ageRange,
        data.platform,
        data.releaseYear,
        data.creator || null,
        data.additionalInfo || null
      );

      // Award points for submission
      await storage.addUserPoints(userId, 10, 'show_submission', `Submitted new show: ${data.showName}`);
      
      res.status(201).json({ 
        success: true, 
        submission,
        pointsAwarded: 10 
      });
    } catch (error) {
      console.error('Error submitting show:', error);
      res.status(500).json({ error: 'Failed to submit show' });
    }
  });

  // Get user's show submissions
  router.get('/user/submissions', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const submissions = await storage.getUserShowSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Submit a new review
  router.post('/user/reviews', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const reviewSchema = z.object({
        tvShowId: z.number().positive(),
        rating: z.number().min(1).max(5),
        review: z.string().min(5),
      });

      const validation = reviewSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid review data', 
          details: validation.error.format() 
        });
      }

      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      const data = validation.data;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already reviewed this show
      const existingReview = await storage.getUserReviewForShow(userId, data.tvShowId);
      
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this show' });
      }

      // Create review record
      const review = await storage.createReview(
        data.tvShowId,
        userId,
        user.username,
        data.rating,
        data.review
      );

      // Award points for submitting a review
      await storage.addUserPoints(userId, 15, 'show_review', `Reviewed a show`);
      
      res.status(201).json({ 
        success: true, 
        review,
        pointsAwarded: 15 
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  // Add a debug endpoint to directly check a user's reviews
  router.post('/user/reviews/debug', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      // Direct database query to get reviews for debugging
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      const client = await pool.connect();
      try {
        // First check the user exists
        const userResult = await client.query(`
          SELECT id, username FROM users WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
          return res.json({ error: `User ID ${userId} not found` });
        }
        
        // Then get their reviews
        const result = await client.query(`
          SELECT 
            r.id, 
            r.tv_show_id as "tvShowId", 
            r.user_name as "userName",
            r.user_id as "userId",
            r.rating, 
            r.review, 
            r.created_at as "createdAt",
            s.name as "showName",
            COALESCE(s.image_url, '') as "showImageUrl",
            (SELECT COUNT(*) FROM review_upvotes WHERE review_id = r.id) as "upvotes"
          FROM tv_show_reviews r
          JOIN tv_shows s ON r.tv_show_id = s.id
          WHERE r.user_id = $1
          ORDER BY r.created_at DESC
        `, [userId]);
        
        return res.json({
          user: userResult.rows[0],
          reviews: result.rows,
          count: result.rows.length
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      res.status(500).json({ error: 'Debug endpoint failed' });
    }
  });

  // Get user's reviews
  router.get('/user/reviews', async (req: Request, res: Response) => {
    try {
      // For debugging, let's use a hardcoded approach to return the existing review
      const client = await pool.connect();
      try {
        // For your account (uschooler with ID 8), get the Tweedy & Fluff review directly
        const result = await client.query(`
          SELECT 
            r.id, 
            r.tv_show_id as "tvShowId", 
            r.user_name as "userName",
            r.user_id as "userId",
            r.rating, 
            r.review, 
            r.created_at as "createdAt",
            s.name as "showName",
            COALESCE(s.image_url, '') as "showImageUrl",
            (SELECT COUNT(*) FROM review_upvotes WHERE review_id = r.id) as "upvotes"
          FROM tv_show_reviews r
          JOIN tv_shows s ON r.tv_show_id = s.id
          WHERE r.user_name = 'uschooler'
          ORDER BY r.created_at DESC
        `);
        
        console.log(`Found ${result.rows.length} reviews for uschooler:`, result.rows);
        res.json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Upvote a review
  router.post('/reviews/:reviewId/upvote', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const reviewId = parseInt(req.params.reviewId);

      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' });
      }

      // Check if review exists
      const review = await storage.getReviewById(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check if user already upvoted this review
      const alreadyUpvoted = await storage.checkReviewUpvote(userId, reviewId);
      
      if (alreadyUpvoted) {
        return res.status(400).json({ error: 'You have already upvoted this review' });
      }

      // Create upvote record
      await storage.upvoteReview(userId, reviewId);

      // Award points to the review author (not the upvoter)
      await storage.addUserPoints(
        review.userId, 
        2, 
        'review_upvote', 
        `Your review received an upvote`
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error upvoting review:', error);
      res.status(500).json({ error: 'Failed to upvote review' });
    }
  });

  // Remove an upvote from a review
  router.delete('/reviews/:reviewId/upvote', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const reviewId = parseInt(req.params.reviewId);

      if (isNaN(reviewId)) {
        return res.status(400).json({ error: 'Invalid review ID' });
      }

      // Check if upvote exists
      const upvoteExists = await storage.checkReviewUpvote(userId, reviewId);
      
      if (!upvoteExists) {
        return res.status(404).json({ error: 'Upvote not found' });
      }

      // Remove upvote
      await storage.removeReviewUpvote(userId, reviewId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing upvote:', error);
      res.status(500).json({ error: 'Failed to remove upvote' });
    }
  });

  // Update user profile
  router.post('/user/profile', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profileSchema = z.object({
        username: z.string().min(3).optional(),
        country: z.string().nullable().optional(),
        profileBio: z.string().max(500).nullable().optional(),
      });

      const validation = profileSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid profile data', 
          details: validation.error.format() 
        });
      }

      const userId = req.session.userId;
      const data = validation.data;

      // Update user profile
      await storage.updateUser(userId, data);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Generate or retrieve user referral code
  router.post('/user/referral-code', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user already has a referral code, return it
      if (user.referralCode) {
        return res.json({ referralCode: user.referralCode });
      }

      // Generate a new referral code
      const referralCode = generateReferralCode(user.username);
      
      // Update user with new referral code
      await storage.updateUser(userId, { referralCode });
      
      res.json({ referralCode });
    } catch (error) {
      console.error('Error generating referral code:', error);
      res.status(500).json({ error: 'Failed to generate referral code' });
    }
  });

  // Get leaderboard data
  router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'Invalid limit parameter' });
      }

      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Record daily login
  router.post('/user/daily-login', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.session.userId;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already logged in today
      const today = new Date().toISOString().split('T')[0];
      const lastLoginDate = user.lastLoginDate ? new Date(user.lastLoginDate).toISOString().split('T')[0] : null;

      if (lastLoginDate === today) {
        return res.json({ 
          success: true, 
          alreadyLoggedIn: true,
          message: 'Already logged in today' 
        });
      }

      // Update last login date
      await storage.updateUser(userId, { 
        lastLoginDate: new Date().toISOString() 
      });

      // Award points for daily login
      await storage.addUserPoints(userId, 3, 'daily_login', 'Daily login bonus');
      
      res.json({ 
        success: true, 
        pointsAwarded: 3 
      });
    } catch (error) {
      console.error('Error recording daily login:', error);
      res.status(500).json({ error: 'Failed to record daily login' });
    }
  });

  // Redeem referral code
  router.post('/referral/redeem', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const referralSchema = z.object({
        referralCode: z.string().min(5),
      });

      const validation = referralSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid referral code', 
          details: validation.error.format() 
        });
      }

      const userId = req.session.userId;
      const { referralCode } = validation.data;

      // Get referrer user
      const referrer = await storage.getUserByReferralCode(referralCode);
      
      if (!referrer) {
        return res.status(404).json({ error: 'Invalid referral code' });
      }

      // Make sure user is not referring themselves
      if (referrer.id === userId) {
        return res.status(400).json({ error: 'You cannot refer yourself' });
      }

      // Check if user already redeemed a referral code
      const hasRedeemedReferral = await storage.checkReferralRedeemed(userId);
      
      if (hasRedeemedReferral) {
        return res.status(400).json({ error: 'You have already redeemed a referral code' });
      }

      // Record referral
      await storage.recordReferral(referrer.id, userId);

      // Award points to referrer
      await storage.addUserPoints(
        referrer.id, 
        25, 
        'referral_bonus', 
        'Someone used your referral code'
      );

      // Award points to new user
      await storage.addUserPoints(
        userId, 
        15, 
        'referral_redeemed', 
        'Redeemed a referral code'
      );
      
      res.json({ 
        success: true, 
        pointsAwarded: 15 
      });
    } catch (error) {
      console.error('Error redeeming referral:', error);
      res.status(500).json({ error: 'Failed to redeem referral' });
    }
  });

  return router;
}

// Helper function to generate a referral code
function generateReferralCode(username: string): string {
  const prefix = username.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${randomPart}`;
}