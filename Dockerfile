# ---------- Frontend build ----------
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend

COPY src/frontend/package.json src/frontend/package-lock.json ./
RUN npm install

COPY src/frontend .
RUN npm run build

FROM mysql:8.0 

# ---------- Backend build ----------
FROM maven:3.9-eclipse-temurin-17 AS backend-builder
WORKDIR /app

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src

# Copy React build into Spring Boot static folder
COPY --from=frontend-builder /frontend/dist ./src/main/resources/static

RUN mvn -B -DskipTests clean package
 

# ---------- Runtime ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN apt-get update
RUN apt-get install -y supervisor
RUN rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /app/target/*.jar app.jar
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

ENTRYPOINT ["/usr/bin/supervisord", "-n"]
