import type { ReviewPlatformAdapter, Review } from '../types';

export class MockReviewPlatform implements ReviewPlatformAdapter {
  async fetchNewReviews(_hotelId: string, _since: Date): Promise<Review[]> {
    return [];
  }
  async postReply(reviewId: string, reply: string) {
    console.log(`[MockReviewPlatform] postReply reviewId=${reviewId} reply="${reply.slice(0, 40)}..."`);
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
