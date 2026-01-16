# V.2 Microservices Architecture (Kubernetes)
<img width="1068" height="804" alt="image" src="https://github.com/user-attachments/assets/0330cfb8-295c-4bd4-bc55-240911274c22" />

# V.1 Microservices Architecture (Docker)
<img width="498" height="412" alt="Microservices Architecture" src="https://github.com/user-attachments/assets/a49aa30a-b2a6-4a0f-bac0-a71b300edcc2" />

This application follows the *Domain-Driven Design (DDD)* approach, where each service owns its own domain logic and database.  
The diagram above shows the complete infrastructure, including frontend applications, load balancer, and tunneling for public access.  
All instances run in a Docker environment on a server.

---

## Communication Between Services
<img width="448" height="336" alt="Service Communication" src="https://github.com/user-attachments/assets/e3c9b073-e6b7-44fc-82f0-c47c29909545" />

The backend services communicate using *gRPC*.  
Each service acts as both a gRPC server and client, exposing its own port for other services to connect and exchange data efficiently.

---

## Load Balancing
<img width="439" height="376" alt="Load Balancing" src="https://github.com/user-attachments/assets/fbcf2625-819e-4c1d-812c-b7094371cd75" />

In production, I use *Nginx* as a load balancer to distribute traffic between service instances.  
This setup allows for better scalability and fault tolerance.  

---

## Application Layers
<img width="711" height="284" alt="Application Layers" src="https://github.com/user-attachments/assets/b2e261fa-7cef-4f65-9797-e01a6d37669b" />

The diagram above illustrates the layered architecture of the system — from the [customer frontend](https://github.com/siwakasen/client-web-app) to the backend and database layers.  
While it might not follow every industry best practice, it’s structured and organized in a way that keeps the overall system maintainable and clear.
