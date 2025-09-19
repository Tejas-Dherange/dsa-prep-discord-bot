import requests
import time

url = "https://leetcode.com/graphql"
query = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    hasMore
    total
    questions {
      questionId
      title
      titleSlug
      difficulty
      isPaidOnly
      acRate
      topicTags { name slug }
    }
  }
}
"""

all_questions = []
skip = 0
limit = 100

while True:
    variables = {"categorySlug": "", "skip": skip, "limit": limit, "filters": {}}
    resp = requests.post(url, json={"query": query, "variables": variables})
    resp.raise_for_status()
    data = resp.json()["data"]["problemsetQuestionList"]

    all_questions.extend(data["questions"])
    print(f"Fetched {len(all_questions)}/{data['total']}")

    if not data["hasMore"]:
        break
    skip += limit
    time.sleep(0.5)  # polite delay

# build links
for q in all_questions[:5]:
    print(q["title"], "->", f"https://leetcode.com/problems/{q['titleSlug']}/")

print("Total problems:", len(all_questions))
