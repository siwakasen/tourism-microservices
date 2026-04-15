task1() {
  docker pull registry.siwakasen.dev/tourism-microservices-customer-service:latest
}
task2() {
  docker pull registry.siwakasen.dev/tourism-microservices-expenses-service
}
task3() {
  docker pull registry.siwakasen.dev/tourism-microservices-report-service
}
task4() {

  docker pull registry.siwakasen.dev/tourism-microservices-live-chat-service
}
task5() {
  docker pull registry.siwakasen.dev/tourism-microservices-employees-service
}
task6() {
  docker pull registry.siwakasen.dev/tourism-microservices-travel-packages-service
}
task7() {
  docker pull registry.siwakasen.dev/tourism-microservices-rent-car-service

}
task8() {
  docker pull registry.siwakasen.dev/tourism-microservices-transaction-service
}

task1 &
task2 &
task3 &
task4 &
task5 &
task6 &
task7 &
task8 &

docker tag registry.siwakasen.dev/tourism-microservices-customer-service:latest tourism-microservices-customer-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-expenses-service:latest tourism-microservices-expenses-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-report-service:latest tourism-microservices-report-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-live-chat-service:latest tourism-microservices-live-chat-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-employees-service:latest tourism-microservices-employees-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-travel-packages-service:latest tourism-microservices-travel-packages-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-rent-car-service:latest tourism-microservices-rent-car-service:latest
docker tag registry.siwakasen.dev/tourism-microservices-transaction-service:latest tourism-microservices-transaction-service:latest

wait
echo "All tasks finished"
