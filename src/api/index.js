import axios from "axios";
const REPO_BASE = "https://api.github.com/repos/lob/jessie-rulesets";
// const REPO_BASE = "https://api.github.com/repos/avinashbn2/json-rule-editor";
const REPO_BASE_URL = `${REPO_BASE}/contents`;
const AC_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

//  scaffolds the request with token and headers
const createRequest = (token, baseURL, headers) => {
  const request = axios.create({
    baseURL: baseURL || REPO_BASE_URL,
  });

  request.defaults.headers.common["Authorization"] = `token ${
    token || AC_TOKEN
  }`;
  request.defaults.headers["content-type"] = "application/json";
  if (headers) {
    request.defaults.headers["Accept"] = headers["Accept"];
  }

  return request;
};

export const getContent = async ({ path, token }) => {
  const request = createRequest(token);
  const rsp = await request.get(path);
  return rsp;
};

// Get the sha of the current file
// its needed for other github apis (create branch, commit)

export const getSha = async ({ path, token }) => {
  const request = createRequest(token);
  const rsp = await request.get(path);
  return rsp;
};

// updates/commits the content  to the path specified
export const updateFile = async ({
  message,
  content,
  sha,
  path,
  token,
  branch = "master",
}) => {
  const request = createRequest(token);
  const body = { message, sha, content: btoa(content), branch };
  const rsp = await request.put(path, body);
  return rsp;
};

// get sha of the master branch
export const getBranchSha = async ({ token }) => {
  const request = createRequest(token, REPO_BASE);
  const rsp = await request.get("/git/refs/heads/master");
  return rsp.data;
};

export const createPR = async ({
  token,
  title,
  content,
  head,
  base = "master",
}) => {
  const request = createRequest(token, REPO_BASE);
  const body = {
    title,
    body: content,
    head,
    base,
  };
  const rsp = await request.post("/pulls", body);
  return rsp.data;
};
export const createBranch = async ({ token, sha, branch }) => {
  const request = createRequest(token, REPO_BASE);
  const body = {
    ref: `refs/heads/${branch}`,
    sha,
    branch,
  };
  const rsp = await request.post("/git/refs", body);
  return rsp.data;
};

// get the diff between the branch specified and the master branch

export const compare = async ({ token, branch }) => {
  const request = createRequest(token, REPO_BASE, {
    Accept: "application/vnd.github.v3.diff",
  });
  const rsp = await request.get(`/compare/master...${branch}`);
  return rsp.data;
};

export const mergePR = async ({ token, pullId }) => {
  const request = createRequest(token, REPO_BASE);
  const rsp = await request.put(`/pulls/${pullId}/merge`);
  return rsp.data;
};

// creates blob of the content specified, needed for grouping multiple file updates in a single commit
// which otherwise would need a separate commit for each file ( without creating tree with blobs)
export const createBlob = async ({ token, content }) => {
  const request = createRequest(token, REPO_BASE);
  const body = {
    content,
  };
  const rsp = await request.post("/git/blobs", body);
  return rsp.data;
};

// when multiple files need to be commited in a single branch need to create a tree of commits
// this is useful in  capability rulesets
export const createTree = async ({ token, tree, ...others }) => {
  const request = createRequest(token, REPO_BASE);
  const body = {
    tree,
    ...others,
  };
  const rsp = await request.post("/git/trees", body);
  return rsp.data;
};

export const createCommit = async ({ message, tree, token, parents }) => {
  // console.log(trggggggee);
  const request = createRequest(token, REPO_BASE);
  const body = { message, tree, parents };
  const rsp = await request.post("/git/commits", body);
  return rsp.data;
};
