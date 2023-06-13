import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const INPUTS_GITHUB_TOKEN: string = core.getInput('token')
    const INPUTS_ISSUE_PREFIX: string = core.getInput('issue-prefix')
    const INPUTS_JIRA_URL: string = core.getInput('jira-url')
    const INPUTS_ISSUE_REGEXP: string = core.getInput('issue-regexp')
    const INPUTS_GITHUB_OCTOKIT = github.getOctokit(INPUTS_GITHUB_TOKEN)

    if (!github.context.payload.pull_request) {
      throw Error('No pull request payload')
    }

    if (!github.context.payload.repository) {
      throw Error('Error loading repo payload')
    }

    if (!github.context.payload.repository.owner.login) {
      throw Error('Error loading owner payload')
    }

    const DEFAULT_ISSUE_REGEXP = new RegExp(`${INPUTS_ISSUE_PREFIX}-[0-9]+`, 'gm')

    const GITHUB_BRANCH_NAME: string = github.context.payload.pull_request.head.ref
    const GITHUB_PR_NUMBER: number = github.context.payload.pull_request.number
    const GITHUB_REPO_OWNER_NAME: string = github.context.payload.repository.owner.login
    const GITHUB_REPO_NAME: string = github.context.payload.repository.name

    const shouldUseCustomRegexp = !!INPUTS_ISSUE_REGEXP

    const regex: RegExp = shouldUseCustomRegexp
      ? new RegExp(INPUTS_ISSUE_REGEXP, 'gm')
      : new RegExp(DEFAULT_ISSUE_REGEXP, 'gm')

    const ticketMatches: string[] = GITHUB_BRANCH_NAME.match(regex) || []

    if (ticketMatches.length) {
      const ticketId = ticketMatches.reverse()[0] // get last matching jira ticket
      const body = `Jira Ticket: [${INPUTS_JIRA_URL}/${ticketId}](${INPUTS_JIRA_URL}/${ticketId})`

      const comments = await INPUTS_GITHUB_OCTOKIT.issues.listComments({
        issue_number: GITHUB_PR_NUMBER,
        owner: GITHUB_REPO_OWNER_NAME,
        repo: GITHUB_REPO_NAME
      })

      const foundComment = !!comments.data.find(it => it.body === body)

      if (!foundComment) {
        await INPUTS_GITHUB_OCTOKIT.issues.createComment({
          body,
          issue_number: GITHUB_PR_NUMBER,
          repo: GITHUB_REPO_NAME,
          owner: GITHUB_REPO_OWNER_NAME
        })
      } else {
        console.info('Jira ticket already assigned')
      }
    } else {
      console.info('No jira ticket found in branch')
    }
  } catch (error: unknown) {
    let errorMessage = 'Failed to run action.'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    core.setFailed(errorMessage)
  }
}

run()
