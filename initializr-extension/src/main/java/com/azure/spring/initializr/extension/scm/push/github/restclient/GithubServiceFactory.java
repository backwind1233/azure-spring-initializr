package com.azure.spring.initializr.extension.scm.push.github.restclient;

import com.azure.spring.initializr.extension.scm.push.common.service.GitService;
import com.azure.spring.initializr.extension.scm.push.common.service.GitServiceFactory;

import static com.azure.spring.initializr.extension.scm.push.common.GitServiceEnum.GITHUB;

public class GithubServiceFactory implements GitServiceFactory {

    private GitHubOAuthClient gitHubOAuthClient;

    private GitHubClient gitHubClient;

    public GithubServiceFactory(GitHubOAuthClient gitHubOAuthClient, GitHubClient gitHubClient) {
        this.gitHubOAuthClient = gitHubOAuthClient;
        this.gitHubClient = gitHubClient;
    }

    @Override
    public GitService getGitService(String code) {
        return new GitService(gitHubOAuthClient, gitHubClient, code);
    }

    @Override
    public boolean support(String gitServiceType) {
        return GITHUB.getName().equals(gitServiceType);
    }
}
