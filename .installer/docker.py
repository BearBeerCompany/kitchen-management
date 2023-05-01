import os

import requests


def check_if_installed():
  version = os.popen("docker -v").read()
  return "Docker version" in version


def check_if_mongo():
  mongo_c = os.popen("docker container ls -la | grep mongo").read()
  return not "".__eq__(mongo_c)


def download_compose():
  url = "https://raw.githubusercontent.com/BearBeerCompany/kitchen-management-server/main/docker/docker-compose.yml"
  open("docker-compose.yml", "wb").write(requests.get(url).content)


def compose_run():
  res = os.popen("docker compose up")
  print(res)


def compose_down():
  res = os.popen("docker compose up")
  print(res)
