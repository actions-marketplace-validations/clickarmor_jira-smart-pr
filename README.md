Uses the branch name to identify the JIRA ticket and adds a link to the ticket in the PR as a comment.

# Configuration

Filename: `.github/workflows/jira_assignment.yml`

Example config:

```yml
name: 'Jira Ticket Assignment'
on: pull_request

jobs:
  add-jira-ticket:
    runs-on: ubuntu-latest
    steps:
      - uses: clickarmor/jira-smart-pr@v.2.0.1
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"
          issue-prefix: PROJ
          jira-url: https://<domain>.atlassian.net/browse
          issue-regexp: [a-zA-Z]+-[0-9]+
```
