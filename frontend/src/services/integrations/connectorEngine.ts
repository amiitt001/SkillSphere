/**
 * Simulates third-party payload responses from external developer accounts.
 */
export async function fetchRemoteIntegrationData(
  integrationId: string,
  credentials: Record<string, string>
): Promise<any> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const sampleToken = credentials.accessToken || 'mock_auth_token';

  switch (integrationId) {
    case 'github':
      return {
        repositoriesUpdated: 2,
        commitsCount: 6,
        latestCommitMsg: 'Refactored docker-compose routing configurations.',
        starsEarned: 3
      };
    case 'leetcode':
      return {
        problemsSolvedDelta: 5,
        newSolvedList: ['LeetCode #146: LRU Cache (Medium)'],
        activeStreakDays: 14
      };
    case 'google_calendar':
      return {
        events: [
          {
            id: 'evt_cal_1',
            title: 'SDE-1 Technical Interview with Razorpay',
            type: 'interview',
            dateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            description: 'Focus on System Design, databases caching strategies, and Docker compose files.'
          },
          {
            id: 'evt_cal_2',
            title: 'AWS Architect Associate Exam Deadline',
            type: 'exam',
            dateTime: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
            description: 'Verify VPC subnets and routing gateways configurations.'
          }
        ]
      };
    case 'coursera':
      return {
        completedCourses: ['System Design Caching Architectures (Advanced)'],
        hoursLogged: 12
      };
    default:
      return {
        status: 'synced',
        timestamp: new Date().toISOString()
      };
  }
}
