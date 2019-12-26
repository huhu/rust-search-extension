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

  git checkout ${BRANCH}
  mv /tmp/public public/
  git config user.name "GitHub Actions"
  git config user.email "github-actions-bot@users.noreply.github.com"
  git add public/
  git commit -m "Deploy new version to Github Pages"
  git push origin ${BRANCH}

  echo "Deploy complete"
}

build
deploy