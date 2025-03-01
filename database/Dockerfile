# Use PostgreSQL 17 Alpine as base image
FROM postgres:latest

# Set default environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=jkpg_city_project
# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/
EXPOSE 5432 