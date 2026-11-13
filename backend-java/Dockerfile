FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw -B dependency:go-offline

COPY src src
RUN ./mvnw -B clean package -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=build /app/target/*.jar app.jar

# Default JVM sizing. Metaspace needs ~200 MB once every code path has loaded,
# and 192m ran out in prod (2026-11-13). ExitOnOutOfMemoryError makes the
# process die so the platform restarts it, instead of staying up unable to
# serve. A JAVA_TOOL_OPTIONS set by Railway/compose replaces this whole line.
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m -XX:MaxMetaspaceSize=320m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
