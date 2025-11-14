# Performance Metrics API Endpoint Documentation

## Endpoint
`POST /api/monitoring/performance-metrics`

## Description
This endpoint receives performance metrics from frontend clients. These metrics include navigation timing, resource loading times, and other performance-related data that helps monitor and optimize the user experience.

## Authentication
This endpoint does not require authentication as it receives data from client-side applications.

## Request Format
```http
POST /api/monitoring/performance-metrics
Content-Type: application/json
```

## Request Body
```json
{
  "dns": "number",
  "tcp": "number",
  "ssl": "number",
  "ttfb": "number",
  "download": "number",
  "domParse": "number",
  "domReady": "number",
  "loadComplete": "number",
  "timestamp": "number",
  "url": "string",
  "userAgent": "string"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dns | number | No | DNS lookup time in milliseconds |
| tcp | number | No | TCP connection time in milliseconds |
| ssl | number | No | SSL/TLS handshake time in milliseconds |
| ttfb | number | No | Time to first byte in milliseconds |
| download | number | No | Download time in milliseconds |
| domParse | number | No | DOM parsing time in milliseconds |
| domReady | number | No | DOM ready time in milliseconds |
| loadComplete | number | No | Page load completion time in milliseconds |
| timestamp | number | Yes | The timestamp when the metrics were captured (milliseconds since epoch) |
| url | string | Yes | The URL where the metrics were measured |
| userAgent | string | Yes | The user agent string of the client |

### Performance Metrics Details

1. **dns**: Time taken for DNS lookup
2. **tcp**: Time taken to establish TCP connection
3. **ssl**: Time taken for SSL/TLS handshake
4. **ttfb**: Time to first byte from the server
5. **download**: Time taken to download the response
6. **domParse**: Time taken to parse the DOM
7. **domReady**: Time taken for the DOM to be ready
8. **loadComplete**: Time taken for the page to fully load

## Response Format

### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Performance metrics recorded"
}
```

### Error Response
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "error": "Failed to process performance metrics"
}
```

## Example Request
```bash
curl -X POST https://your-domain.com/api/monitoring/performance-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "dns": 25,
    "tcp": 10,
    "ssl": 50,
    "ttfb": 100,
    "download": 200,
    "domParse": 50,
    "domReady": 10,
    "loadComplete": 5,
    "timestamp": 1678886400000,
    "url": "https://example.com/page",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }'
```

## Implementation Details
The endpoint currently logs the received metrics to the console. In a production environment, these metrics would typically be stored in a database for further analysis and monitoring.

## Related Files
- `app/api/monitoring/performance-metrics/route.ts` - The implementation of this endpoint
- `src/lib/monitoring.ts` - The frontend implementation that sends data to this endpoint

## Monitoring
Performance metrics data is collected automatically by the frontend application using the Navigation Timing API and sent to this endpoint. The data is used to monitor and improve the performance of the application.