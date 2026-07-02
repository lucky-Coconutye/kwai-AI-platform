#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if [ ! -x "./mvnw" ] && command -v mvn >/dev/null 2>&1; then
  mvn spring-boot:run
  exit 0
fi

if [ -x "./mvnw" ]; then
  ./mvnw spring-boot:run
  exit 0
fi

echo "未找到 mvn 或 mvnw。请先安装 Maven，或在公司 Java 工程中引入本目录代码。"
exit 1
