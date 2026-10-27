# Token Bucket Rate Limiter Service

A standalone API rate-limiting service built with Node.js, Express.js, and MongoDB.

The goal of this project is to build a reusable service that allows other applications to check whether a client request should be allowed or denied based on configurable rate limits.

## Project Status

🚧 Under Development

The initial Express application and MongoDB connection are being implemented.

## Planned Features

- Token bucket rate-limiting algorithm
- Sliding-window rate-limiting algorithm
- Per-client configurable rate limits
- Persistent rate-limit state
- Atomic operations for concurrent requests
- Administrative APIs for managing client configurations
- Authentication and authorization
- Standard rate-limit response headers
- Automated unit and integration tests
- Load testing at 500+ requests per second
- Distributed rate limiting
- Optional monitoring dashboard

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Zod
- Helmet
- Vitest
- Supertest
- k6 (planned for load testing)

## Prerequisites

- Node.js LTS
- npm
- MongoDB local installation or MongoDB Atlas
- Git

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd token-bucket-rate-limiter