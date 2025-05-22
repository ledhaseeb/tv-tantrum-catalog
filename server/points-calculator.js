/**
 * Points Calculator Utility
 * 
 * This file contains functions for calculating user points based on various activities.
 * It helps maintain consistent point values across different parts of the application.
 */

const POINTS = {
  REVIEW: 5,            // Points for submitting a review
  UPVOTE_GIVEN: 1,      // Points for upvoting someone else's review
  UPVOTE_RECEIVED: 2,   // Points for receiving an upvote on your review
  LOGIN_STREAK: 1,      // Points per day of login streak
  SHARE: 2,             // Points for sharing content
  REFERRAL: 10,         // Points for referring a new user
  SHOW_SUBMISSION: 10,  // Points for submitting a new show that gets approved
  RESEARCH_READ: 1      // Points for reading a research article
};

/**
 * Calculate points for upvotes received
 * @param {number} count - Number of upvotes received
 * @returns {number} Total points
 */
function calculateUpvoteReceivedPoints(count) {
  return count * POINTS.UPVOTE_RECEIVED;
}

/**
 * Calculate points for reviews submitted
 * @param {number} count - Number of reviews submitted
 * @returns {number} Total points
 */
function calculateReviewPoints(count) {
  return count * POINTS.REVIEW;
}

module.exports = {
  POINTS,
  calculateUpvoteReceivedPoints,
  calculateReviewPoints
};