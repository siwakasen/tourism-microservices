#!/usr/bin/env bash
set -e
# Build the image on the amd64 computer (not arm)

docker tag tourism-microservices-customer-service:latest registry.siwakasen.dev/tourism-microservices-customer-service:latest
docker tag tourism-microservices-expenses-service:latest registry.siwakasen.dev/tourism-microservices-expenses-service:latest
docker tag tourism-microservices-report-service:latest registry.siwakasen.dev/tourism-microservices-report-service:latest
docker tag tourism-microservices-live-chat-service:latest registry.siwakasen.dev/tourism-microservices-live-chat-service:latest
docker tag tourism-microservices-employees-service:latest registry.siwakasen.dev/tourism-microservices-employees-service:latest
docker tag tourism-microservices-travel-packages-service:latest registry.siwakasen.dev/tourism-microservices-travel-packages-service:latest
docker tag tourism-microservices-rent-car-service:latest registry.siwakasen.dev/tourism-microservices-rent-car-service:latest
docker tag tourism-microservices-transaction-service:latest registry.siwakasen.dev/tourism-microservices-transaction-service:latest

task1() {
  docker push registry.siwakasen.dev/tourism-microservices-customer-service:latest
}
task2() {
  docker push registry.siwakasen.dev/tourism-microservices-expenses-service
}
task3() {
  docker push registry.siwakasen.dev/tourism-microservices-report-service
}
task4() {

  docker push registry.siwakasen.dev/tourism-microservices-live-chat-service
}
task5() {
  docker push registry.siwakasen.dev/tourism-microservices-employees-service
}
task6() {
  docker push registry.siwakasen.dev/tourism-microservices-travel-packages-service
}
task7() {
  docker push registry.siwakasen.dev/tourism-microservices-rent-car-service

}
task8() {
  docker push registry.siwakasen.dev/tourism-microservices-transaction-service
}

task1 &
task2 &
task3 &
task4 &
task5 &
task6 &
task7 &
task8 &

wait
echo "All tasks finished"
