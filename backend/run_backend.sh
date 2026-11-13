#!/bin/bash
echo "====================================================================="
echo " Starting PotholeAI - Java Spring Boot Backend Server"
echo "====================================================================="

cd "$(dirname "$0")"

if command -v mvn >/dev/null 2>&1; then
    mvn spring-boot:run
else
    ./mvnw spring-boot:run
fi
