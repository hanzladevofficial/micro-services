# Microservices Architecture - Blog Application

## 📋 Project Overview

This is a **microservices-based blog application** built from scratch to demonstrate how independent services communicate and work together in a distributed system. The application allows users to create posts and add comments, with an automated moderation system that filters inappropriate content.

## 🏗️ Architecture Overview

This project implements an **event-driven microservices architecture** where services communicate asynchronously through an event bus. Each service is independently deployable, containerized with Docker, and orchestrated using Kubernetes.

### Why Microservices?

- **Independent Deployment**: Each service can be updated without affecting others
- **Scalability**: Services can be scaled independently based on demand
- **Technology Flexibility**: Each service can use different technologies if needed
- **Fault Isolation**: If one service fails, others continue to operate
- **Team Autonomy**: Different teams can work on different services simultaneously

---

## 🔧 Services Architecture

### 1. **Posts Service** (Port: 4000)
**Purpose**: Manages all post-related operations

**Responsibilities**:
- Creates new blog posts with unique IDs
- Stores posts in memory (in-memory database)
- Emits `PostCreated` events to the event bus when a new post is created
- Listens for events from other services (for future extensibility)

**Key Features**:
- Generates random unique IDs using crypto library
- Validates post data before creation
- Communicates with event-bus-srv using Kubernetes service discovery

**API Endpoints**:
- `POST /posts/create` - Create a new post
- `POST /events` - Receive events from event bus

---

### 2. **Comments Service** (Port: 4001)
**Purpose**: Handles comment creation and management

**Responsibilities**:
- Creates comments associated with specific posts
- Stores comments organized by post ID
- Emits `CommentCreated` events when new comments are added
- Listens for `CommentModerated` events from the moderation service
- Updates comment status (pending → approved/rejected)
- Emits `CommentUpdated` events after moderation

**Key Features**:
- Each comment has a status: `pending`, `approved`, or `rejected`
- Maintains a mapping of comments by post ID
- Handles the complete comment lifecycle from creation to moderation

**API Endpoints**:
- `GET /posts/:id/comments` - Get all comments for a post
- `POST /posts/:id/comments` - Create a new comment
- `POST /events` - Receive and process events

**Event Flow**:
1. Comment created → Status: `pending`
2. Moderation service checks content
3. Status updated to `approved` or `rejected`
4. Updated comment broadcasted to all services

---

### 3. **Query Service** (Port: 4002)
**Purpose**: Provides optimized data retrieval for the frontend

**Why Query Service?**
In microservices, directly querying multiple services creates problems:
- Multiple network requests slow down the application
- If one service is down, the entire page fails
- Complex client-side data aggregation

**Solution**: The Query Service maintains a **denormalized view** of data by listening to all events and building a complete picture.

**Responsibilities**:
- Listens to `PostCreated`, `CommentCreated`, and `CommentUpdated` events
- Maintains an aggregated data structure with posts and their comments
- Provides a single endpoint for the frontend to fetch all data
- Syncs with event bus on startup to rebuild state (handles service restarts)

**Key Features**:
- **Data Denormalization**: Stores posts with embedded comments
- **Event Sourcing**: Rebuilds state from event history on startup
- **Single Source of Truth for UI**: Frontend only needs one API call

**API Endpoints**:
- `GET /posts` - Get all posts with their comments
- `GET /posts/:id/comments` - Get comments for a specific post
- `POST /events` - Process incoming events

**Data Structure**:
```javascript
{
  "post-id-1": {
    id: "post-id-1",
    title: "Post Title",
    comments: [
      { id: "comment-id-1", content: "Comment text", status: "approved" }
    ]
  }
}
```

---

### 4. **Moderation Service** (Port: 4003)
**Purpose**: Automated content moderation for comments

**Responsibilities**:
- Listens for `CommentCreated` events
- Analyzes comment content for inappropriate words
- Emits `CommentModerated` events with approval/rejection status

**Moderation Logic**:
- **Approved**: Comment doesn't contain banned words
- **Rejected**: Comment contains the word "orange" (example banned word)

**Key Features**:
- Stateless service (doesn't store data)
- Can be extended with ML models or external moderation APIs
- Processes comments asynchronously

**API Endpoints**:
- `POST /events` - Receive and process comment events

**Event Flow**:
```
CommentCreated → Moderation Check → CommentModerated → CommentUpdated
```

---

### 5. **Event Bus Service** (Port: 4005)
**Purpose**: Central communication hub for all services

**Responsibilities**:
- Receives events from any service
- Broadcasts events to all other services
- Stores event history for service synchronization
- Enables loose coupling between services

**Key Features**:
- **Pub/Sub Pattern**: Publishers don't know about subscribers
- **Event Store**: Maintains history of all events
- **Service Discovery**: Uses Kubernetes service names for routing
- **Resilience**: Services can restart and catch up on missed events

**How It Works**:
1. Service A posts an event to `/events`
2. Event bus stores the event
3. Event bus forwards the event to all services (posts, comments, query, moderation)
4. Each service processes the event based on its type

**API Endpoints**:
- `POST /events` - Receive and broadcast events
- `GET /events` - Retrieve event history (for service sync)

**Event Broadcasting**:
```javascript
// Sends to all services simultaneously
axios.post("http://posts-srv:4000/events", event);
axios.post("http://comments-srv:4001/events", event);
axios.post("http://query-srv:4002/events", event);
axios.post("http://moderation-srv:4003/events", event);
```

---

### 6. **Client Service** (Port: 3000)
**Purpose**: React-based frontend application

**Responsibilities**:
- Provides user interface for creating posts and comments
- Displays posts with their comments
- Shows comment status (pending, approved, rejected)
- Communicates with backend through Ingress

**Key Components**:
- **PostCreate**: Form to create new posts
- **PostList**: Displays all posts
- **CommentCreate**: Form to add comments to posts
- **CommentList**: Shows comments with status-based rendering

**Features**:
- Real-time UI updates after creating posts/comments
- Status-based comment display:
  - `approved`: Shows actual comment
  - `pending`: Shows "This comment is awaiting moderation"
  - `rejected`: Shows "This comment has been rejected"

**API Communication**:
All requests go through `http://posts.com` (Ingress routes to appropriate services)

---

## 🔄 Event-Driven Communication Flow

### Example: Creating a Comment

1. **User Action**: User submits a comment through the client
2. **Client → Comments Service**: `POST /posts/:id/comments`
3. **Comments Service**: 
   - Creates comment with status `pending`
   - Emits `CommentCreated` event to event bus
4. **Event Bus**: Broadcasts event to all services
5. **Moderation Service**: 
   - Receives `CommentCreated` event
   - Checks content for banned words
   - Emits `CommentModerated` event with status
6. **Comments Service**: 
   - Receives `CommentModerated` event
   - Updates comment status
   - Emits `CommentUpdated` event
7. **Query Service**: 
   - Receives `CommentUpdated` event
   - Updates its aggregated data store
8. **Client**: Fetches updated data from Query Service

### Event Types

| Event Type | Emitted By | Consumed By | Purpose |
|------------|-----------|-------------|---------||
| `PostCreated` | Posts Service | Query Service | Notify about new post |
| `CommentCreated` | Comments Service | Query, Moderation | Notify about new comment |
| `CommentModerated` | Moderation Service | Comments Service | Send moderation result |
| `CommentUpdated` | Comments Service | Query Service | Notify about comment status change |

---

## 🐳 Docker Containerization

Each service has its own Dockerfile that:
- Uses Node.js 20 Alpine (lightweight base image)
- Sets up working directory
- Installs dependencies
- Copies application code
- Defines startup command

**Benefits**:
- **Consistency**: Same environment in development and production
- **Isolation**: Each service runs in its own container
- **Portability**: Can run anywhere Docker is installed
- **Version Control**: Docker images are versioned and stored in Docker Hub

**Docker Images** (stored on Docker Hub):
- `hanzladev/micro-service-posts`
- `hanzladev/micro-service-comments`
- `hanzladev/micro-service-query`
- `hanzladev/micro-service-moderation`
- `hanzladev/micro-service-event-bus`
- `hanzladev/micro-service-client`

---

## ☸️ Kubernetes Orchestration

### Infrastructure Setup (`/infra/k8s/`)

Kubernetes manages the deployment, scaling, and networking of all containerized services.

### Key Kubernetes Concepts Used

#### 1. **Pods**
- Smallest deployable unit in Kubernetes
- Each pod runs one container (one service)
- Pods are ephemeral and can be recreated

#### 2. **Deployments**
- Manages pod lifecycle
- Ensures desired number of replicas are running
- Handles rolling updates and rollbacks
- Each service has its own deployment file

**Deployment Configuration**:
```yaml
replicas: 1  # Number of pod instances
imagePullPolicy: Always  # Always pull latest image
```

#### 3. **Services (ClusterIP)**
- Provides stable networking for pods
- Pods get dynamic IPs, Services provide static DNS names
- Enables service-to-service communication

**Service Discovery**:
- `posts-srv:4000` → Posts Service
- `comments-srv:4001` → Comments Service
- `query-srv:4002` → Query Service
- `moderation-srv:4003` → Moderation Service
- `event-bus-srv:4005` → Event Bus Service
- `client-srv:3000` → Client Service

**Why ClusterIP?**
- Internal communication only
- Not exposed to outside world
- Secure and efficient

#### 4. **Ingress (NGINX)**
- Acts as a reverse proxy and load balancer
- Single entry point for external traffic
- Routes requests to appropriate services based on URL paths

**Routing Rules** (`posts.com`):
- `/posts/create` → Posts Service (4000)
- `/posts/:id/comments` → Comments Service (4001)
- `/posts` → Query Service (4002)
- `/` → Client Service (3000)

**Benefits**:
- Single domain for entire application
- Path-based routing
- SSL/TLS termination (can be added)
- Load balancing

#### 5. **Cluster**
- Set of machines (nodes) running Kubernetes
- Manages all pods, services, and deployments
- Provides self-healing (restarts failed pods)

---

## 🚀 How Everything Works Together

### System Flow Diagram

```
User Browser
    ↓
Ingress (posts.com)
    ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  Client Service (React)                         │
│                                                 │
└─────────────────────────────────────────────────┘
    ↓                           ↓
Posts Service              Comments Service
    ↓                           ↓
         Event Bus Service
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Query Service    Moderation Service
```

### Request Flow Examples

**Creating a Post**:
1. User fills form in Client
2. Client → Ingress → Posts Service
3. Posts Service creates post
4. Posts Service → Event Bus (`PostCreated`)
5. Event Bus → Query Service
6. Query Service updates its data store

**Creating a Comment**:
1. User adds comment in Client
2. Client → Ingress → Comments Service
3. Comments Service creates comment (status: pending)
4. Comments Service → Event Bus (`CommentCreated`)
5. Event Bus → Moderation Service
6. Moderation Service checks content
7. Moderation Service → Event Bus (`CommentModerated`)
8. Event Bus → Comments Service
9. Comments Service updates status
10. Comments Service → Event Bus (`CommentUpdated`)
11. Event Bus → Query Service
12. Query Service updates aggregated data

**Viewing Posts**:
1. User opens application
2. Client → Ingress → Query Service
3. Query Service returns all posts with comments
4. Client renders the data

---

## 🛠️ Technology Stack

### Backend Services
- **Runtime**: Node.js
- **Framework**: Express.js
- **HTTP Client**: Axios
- **ID Generation**: Crypto (randomBytes)

### Frontend
- **Framework**: React
- **HTTP Client**: Axios
- **Styling**: Bootstrap (CSS classes)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Ingress Controller**: NGINX
- **Image Registry**: Docker Hub

---

## 📦 Project Structure

```
micro-services-module-1/
│
├── posts/                    # Posts microservice
│   ├── index.js             # Service logic
│   ├── Dockerfile           # Container definition
│   └── package.json         # Dependencies
│
├── comments/                 # Comments microservice
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
│
├── query/                    # Query microservice
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
│
├── moderation/               # Moderation microservice
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
│
├── event-bus/                # Event bus microservice
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
│
├── client/                   # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── PostCreate.js
│   │   ├── PostList.js
│   │   ├── CommentCreate.js
│   │   └── CommentList.js
│   ├── Dockerfile
│   └── package.json
│
└── infra/                    # Kubernetes configuration
    └── k8s/
        ├── posts-depl.yml
        ├── comments-depl.yml
        ├── query-depl.yml
        ├── moderation-depl.yml
        ├── event-bus-depl.yml
        ├── client-depl.yml
        └── ingress-srv.yml
```

---

## 🎯 Key Learning Concepts

### 1. **Microservices Communication Patterns**
- **Synchronous**: Direct HTTP requests (not used here to avoid tight coupling)
- **Asynchronous**: Event-driven communication through event bus

### 2. **Data Management**
- **Database per Service**: Each service manages its own data
- **Data Denormalization**: Query service maintains aggregated view
- **Event Sourcing**: Rebuilding state from event history

### 3. **Service Discovery**
- Kubernetes DNS for service-to-service communication
- Services reference each other by name (e.g., `http://posts-srv:4000`)

### 4. **Resilience Patterns**
- **Event Store**: Services can catch up on missed events after restart
- **Stateless Services**: Moderation service doesn't store data
- **Self-Healing**: Kubernetes restarts failed pods automatically

### 5. **API Gateway Pattern**
- Ingress acts as API gateway
- Single entry point for external traffic
- Path-based routing to internal services

---

## 🔑 Key Terminology

| Term | Definition |
|------|------------|
| **Docker** | Platform for containerizing applications into isolated environments |
| **Container** | Lightweight, standalone package containing code and dependencies |
| **Kubernetes (K8s)** | Container orchestration platform for automating deployment and scaling |
| **Pod** | Smallest deployable unit in Kubernetes (runs one or more containers) |
| **Deployment** | Kubernetes resource that manages pod lifecycle and scaling |
| **Service (ClusterIP)** | Provides stable networking and DNS for pods within the cluster |
| **NodePort** | Exposes service on each node's IP at a static port (not used here) |
| **Ingress** | Manages external access to services via HTTP/HTTPS routing |
| **Event Bus** | Central hub for asynchronous communication between services |
| **Event-Driven Architecture** | Services communicate by emitting and listening to events |
| **Service Discovery** | Mechanism for services to find and communicate with each other |
| **Denormalization** | Storing duplicate data for faster queries (Query Service) |

---

## 🔧 Development with Skaffold

### What is Skaffold?

Skaffold is a command-line tool that facilitates continuous development for Kubernetes applications. It automates the workflow for building, pushing, and deploying your application.

**Benefits**:
- **Automated Rebuilds**: Detects code changes and rebuilds images automatically
- **Hot Reload**: Syncs file changes without full rebuilds (for faster development)
- **Simplified Workflow**: Single command to run entire microservices application
- **No Manual Docker Commands**: Handles building and deploying all services

### Skaffold Configuration (`skaffold.yml`)

The project includes a Skaffold configuration that:
- Builds all 6 service Docker images locally
- Deploys all Kubernetes manifests from `infra/k8s/`
- Watches for file changes and auto-syncs:
  - Client service: `src/**/*.js` files
  - Backend services: `*.js` files
- Skips pushing to Docker Hub (uses local images)

### Using Skaffold

**Start Development Mode**:
```bash
skaffold dev
```
This command will:
1. Build all Docker images
2. Deploy to Kubernetes
3. Stream logs from all services
4. Watch for code changes and auto-reload

**Run Once (No Watch)**:
```bash
skaffold run
```

**Delete Deployments**:
```bash
skaffold delete
```

---

## 🚦 Getting Started

### Prerequisites
- Docker installed
- Kubernetes cluster (Minikube, Docker Desktop, or cloud provider)
- kubectl CLI tool
- Ingress NGINX controller installed
- Skaffold CLI tool (optional, for automated workflow)

### Option 1: Using Skaffold (Recommended)

1. **Install Skaffold**:
```bash
# macOS
brew install skaffold

# Linux
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/

# Windows (using Chocolatey)
choco install skaffold
```

2. **Configure Hosts File**:
Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 posts.com
```

3. **Start Application**:
```bash
skaffold dev
```

4. **Access Application**:
Open browser and navigate to `http://posts.com`

### Option 2: Manual Deployment

1. **Build and Push Docker Images**:
```bash
docker build -t hanzladev/micro-service-posts ./posts
docker push hanzladev/micro-service-posts
# Repeat for all services
```

2. **Apply Kubernetes Configurations**:
```bash
kubectl apply -f infra/k8s/
```

3. **Configure Hosts File**:
Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 posts.com
```

4. **Access Application**:
Open browser and navigate to `http://posts.com`

---

## 🔮 Future Enhancements

- Add persistent databases (MongoDB, PostgreSQL)
- Implement authentication and authorization
- Add message queue (RabbitMQ, Kafka) for better event handling
- Implement CQRS pattern more formally
- Add monitoring and logging (Prometheus, Grafana, ELK stack)
- Implement circuit breakers for resilience
- Add API rate limiting
- Implement distributed tracing (Jaeger, Zipkin)
- Add automated testing (unit, integration, e2e)
- Implement CI/CD pipeline

---

## 📚 What This Project Demonstrates

✅ Building microservices from scratch  
✅ Event-driven architecture  
✅ Docker containerization  
✅ Kubernetes orchestration  
✅ Service-to-service communication  
✅ Data denormalization and query optimization  
✅ Asynchronous processing  
✅ Content moderation workflow  
✅ API gateway pattern with Ingress  
✅ Service discovery in Kubernetes  
✅ Handling eventual consistency  

---

## 📝 Notes

- This is a **learning project** built from scratch to understand microservices fundamentals
- Services use **in-memory storage** (data is lost on restart)
- The moderation logic is **simplified** (checks for the word "orange")
- **No authentication** is implemented (would be added in production)
- Event bus is a **simple implementation** (production would use RabbitMQ/Kafka)
- All services communicate through **Kubernetes internal networking**

---

## 🤝 Contributing

This is a personal learning project. Feel free to fork and experiment with your own modifications!

---

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ while learning microservices architecture**