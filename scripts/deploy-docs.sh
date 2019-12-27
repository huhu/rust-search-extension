#!/usr/bin/env bash
set -e

BRANCH="gh-pages"

build() {
  echo "Starting building..."

  cd docs
  sudo snap install --edge zola
  zola build
  mv public /tmp/public
  cd ..
}

deploy() {
  echo "Starting deploying..."
  git config --global url."https://".insteadOf git://
  git config --global url."https://github.com/".insteadOf git@github.com:

  git checkout ${BRANCH}
  rm -rf public/ && mv /tmp/public .
  git config user.name "GitHub Actions"
  git config user.email "github-actions-bot@users.noreply.github.com"
  git add public/
  git commit -m "Deploy new version to Github Pages"
  git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" ${BRANCH}:${BRANCH}

  echo "Deploy complete"
}

build
deploy