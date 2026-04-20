"""
Performance Test: GET /public/stories
Tool: Locust
Target: VoicesOfSyria Backend API

How to run:
  1. Install: pip install locust
  2. Start your Spring Boot server on port 8080
  3. Run: locust -f locustfile.py --host=http://localhost:8080
  4. Open browser: http://localhost:8089
  5. Set: Number of users = 50, Spawn rate = 10, then Start
"""

from locust import HttpUser, task, between


class StoriesUser(HttpUser):
    """
    Simulates a visitor browsing stories on VoicesOfSyria.
    Wait between 1-3 seconds between requests (realistic user behavior).
    """
    wait_time = between(1, 3)

    @task(3)
    def get_all_stories(self):
        """
        Main task: GET /public/stories
        Weight = 3 (most frequent - 75% of requests)
        Tests: database query + JSON serialization under load
        """
        with self.client.get(
            "/public/stories",
            name="GET /public/stories",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Expected 200, got {response.status_code}")

    @task(1)
    def get_single_story(self):
        """
        Secondary task: GET /public/stories/1
        Weight = 1 (less frequent - 25% of requests)
        Tests: single story lookup by ID
        """
        with self.client.get(
            "/public/stories/1",
            name="GET /public/stories/{id}",
            catch_response=True
        ) as response:
            # 200 = found, 404 = story not found (both are valid)
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")
