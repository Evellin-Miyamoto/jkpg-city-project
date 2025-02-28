# Use PostgreSQL 17 Alpine as base image
FROM postgres:17-alpine

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Set default environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=postgres

EXPOSE 5432 