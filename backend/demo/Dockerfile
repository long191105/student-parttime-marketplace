FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml settings.xml ./
RUN mvn -B -s settings.xml dependency:go-offline
COPY src ./src
RUN mvn -B -s settings.xml -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/target/demo-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "app.jar"]
