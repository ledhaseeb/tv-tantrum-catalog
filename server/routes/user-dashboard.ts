import { Request, Response, Router } from 'express';
import { IStorage } from '../storage';
import { z } from 'zod';

// Request validation schemas
const pointsHistorySchema = z.object({
  userId: z.number().optional(),
  limit: z.number().optional().default(20)
});

const readResearchSchema = z.object({
  researchId: z.number(),
});

const submitShowSchema = z.object({
  showName: z.string().min(1, "Show name is required"),
  description: z.string().min(1, "Description is required"),
  ageRange: z.string().optional(),
  platform: z.string().optional(),
  releaseYear: z.number().optional(),
  creator: z.string().optional(),
  additionalInfo: z.string().optional()
});

const submitReviewSchema = z.object({
  tvShowId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Review comment is required")
});

const upvoteReviewSchema = z.object({
  reviewId: z.number()
});

const updateProfileSchema = z.object({
  bio: z.string().optional(),
  country: z.string().optional()
});

const referralSchema = z.object({
  code: z.string()
});

export default function setupUserDashboardRoutes(router: Router, storage: IStorage) {
  // Get user points history
  router.get('/user/points-history', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { limit } = pointsHistorySchema.parse({ 
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20 
      });
      
      const history = await storage.getUserPointsHistory(req.user.id, limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching points history:', error);
      res.status(500).json({ message: 'Failed to fetch points history' });
    }
  });

  // Mark research as read
  router.post('/user/research/read', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { researchId } = readResearchSchema.parse(req.body);
      
      // Check if user has already read this research
      const hasRead = await storage.hasUserReadResearch(req.user.id, researchId);
      
      if (hasRead) {
        return res.status(200).json({ message: 'Research already marked as read' });
      }
      
      // Mark as read and award points
      const result = await storage.markResearchAsRead(req.user.id, researchId);
      
      // Add points for reading the research
      await storage.addUserPoints({
        userId: req.user.id,
        points: 10,
        activityType: 'research',
        activityId: researchId,
        description: 'Read a research summary'
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error marking research as read:', error);
      res.status(500).json({ message: 'Failed to mark research as read' });
    }
  });

  // Get user's read research
  router.get('/user/research/read', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const readResearch = await storage.getUserReadResearch(req.user.id);
      res.json(readResearch);
    } catch (error) {
      console.error('Error fetching read research:', error);
      res.status(500).json({ message: 'Failed to fetch read research' });
    }
  });

  // Submit a show
  router.post('/user/submissions', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const submissionData = submitShowSchema.parse(req.body);
      
      const submission = await storage.createShowSubmission({
        userId: req.user.id,
        showName: submissionData.showName,
        description: submissionData.description,
        ageRange: submissionData.ageRange,
        platform: submissionData.platform,
        releaseYear: submissionData.releaseYear,
        creator: submissionData.creator,
        additionalInfo: submissionData.additionalInfo
      });
      
      // Award points for submitting a show
      await storage.addUserPoints({
        userId: req.user.id,
        points: 15,
        activityType: 'submission',
        activityId: submission.id,
        description: `Submitted a new show: ${submissionData.showName}`
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error submitting show:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid submission data', errors: error.format() });
      } else {
        res.status(500).json({ message: 'Failed to submit show' });
      }
    }
  });

  // Get user's submissions
  router.get('/user/submissions', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const submissions = await storage.getUserShowSubmissions(req.user.id);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  // Submit a review
  router.post('/user/reviews', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const reviewData = submitReviewSchema.parse(req.body);
      
      const review = await storage.createReview({
        userId: req.user.id,
        tvShowId: reviewData.tvShowId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      
      // Award points for submitting a review
      await storage.addUserPoints({
        userId: req.user.id,
        points: 5,
        activityType: 'rating',
        activityId: review.id,
        description: `Left a review for a show`
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid review data', errors: error.format() });
      } else {
        res.status(500).json({ message: 'Failed to submit review' });
      }
    }
  });

  // Get user's reviews
  router.get('/user/reviews', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const reviews = await storage.getReviewsByUserId(req.user.id);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // Upvote a review
  router.post('/reviews/:reviewId/upvote', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const reviewId = parseInt(req.params.reviewId);
      
      // Check if review exists
      const review = await storage.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      // Check if user has already upvoted this review
      const hasUpvoted = await storage.hasUserUpvotedReview(req.user.id, reviewId);
      
      if (hasUpvoted) {
        return res.status(400).json({ message: 'You have already upvoted this review' });
      }
      
      // Add upvote
      const upvote = await storage.upvoteReview(req.user.id, reviewId);
      
      // Give points to the reviewer (not the upvoter)
      if (review.userId !== req.user.id) { // Don't give points for upvoting your own review
        await storage.addUserPoints({
          userId: review.userId, // Points go to the reviewer
          points: 2,
          activityType: 'upvote',
          activityId: reviewId,
          description: 'Someone upvoted your review'
        });
      }
      
      res.status(201).json(upvote);
    } catch (error) {
      console.error('Error upvoting review:', error);
      res.status(500).json({ message: 'Failed to upvote review' });
    }
  });

  // Remove an upvote
  router.delete('/reviews/:reviewId/upvote', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const reviewId = parseInt(req.params.reviewId);
      
      // Check if user has upvoted this review
      const hasUpvoted = await storage.hasUserUpvotedReview(req.user.id, reviewId);
      
      if (!hasUpvoted) {
        return res.status(400).json({ message: 'You have not upvoted this review' });
      }
      
      // Remove upvote
      await storage.removeUpvote(req.user.id, reviewId);
      
      // Deduct points from the reviewer
      const review = await storage.getReviewById(reviewId);
      if (review && review.userId !== req.user.id) {
        await storage.addUserPoints({
          userId: review.userId,
          points: -2, // Negative points for removed upvote
          activityType: 'upvote',
          activityId: reviewId,
          description: 'Someone removed their upvote from your review'
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing upvote:', error);
      res.status(500).json({ message: 'Failed to remove upvote' });
    }
  });

  // Update user profile
  router.post('/user/profile', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const profileData = updateProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.user.id, {
        profileBio: profileData.bio,
        country: profileData.country
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid profile data', errors: error.format() });
      } else {
        res.status(500).json({ message: 'Failed to update profile' });
      }
    }
  });

  // Generate referral code
  router.post('/user/referral-code', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const referralCode = await storage.generateReferralCode(req.user.id);
      res.json({ referralCode });
    } catch (error) {
      console.error('Error generating referral code:', error);
      res.status(500).json({ message: 'Failed to generate referral code' });
    }
  });

  // Get leaderboard
  router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topUsers = await storage.getTopUsers(limit);
      
      // Return simplified user data for the leaderboard
      const leaderboard = topUsers.map(user => ({
        id: user.id,
        username: user.username,
        totalPoints: user.totalPoints || 0
      }));
      
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  // Track daily login points
  router.post('/user/daily-login', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // Check if the user has already received points for today
      const shouldAwardPoints = await storage.checkDailyLoginPoints(req.user.id);
      
      if (shouldAwardPoints) {
        // Award points for daily login
        await storage.addUserPoints({
          userId: req.user.id,
          points: 5,
          activityType: 'login',
          description: 'Daily login bonus'
        });
        
        // Update last login date
        await storage.updateLastLogin(req.user.id);
        
        res.json({ success: true, pointsAwarded: true });
      } else {
        // Update the login date but don't award points
        await storage.updateLastLogin(req.user.id);
        res.json({ success: true, pointsAwarded: false });
      }
    } catch (error) {
      console.error('Error processing daily login:', error);
      res.status(500).json({ message: 'Failed to process daily login' });
    }
  });

  // Redeem a referral code (for new users during registration)
  router.post('/referral/redeem', async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { code } = referralSchema.parse(req.body);
      
      // Find the user who owns this referral code
      const referrer = await storage.getUserByReferralCode(code);
      
      if (!referrer) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }
      
      if (referrer.id === req.user.id) {
        return res.status(400).json({ message: 'You cannot use your own referral code' });
      }
      
      // Award points to the referrer
      await storage.trackReferral(referrer.id, req.user.id);
      
      // Also give some points to the new user for using a referral code
      await storage.addUserPoints({
        userId: req.user.id,
        points: 10,
        activityType: 'referral',
        description: `Signed up with a referral code`
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error redeeming referral code:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid referral code format', errors: error.format() });
      } else {
        res.status(500).json({ message: 'Failed to redeem referral code' });
      }
    }
  });

  return router;
}