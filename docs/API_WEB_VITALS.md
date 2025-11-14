# Web Vitals API Endpoint Documentation

## Endpoint
`POST /api/analytics/web-vitals`

## Description
This endpoint receives Web Vitals metrics from frontend clients. Web Vitals are a set of metrics that measure the user experience on web pages. These metrics are collected by the frontend application and sent to this endpoint for monitoring and analysis.

## Authentication
This endpoint does not require authentication as it receives data from client-side applications.

## Request Format
```http
POST /api/analytics/web-vitals
Content-Type: application/json
```

## Request Body
```json
{
  "name": "string",
  "value": "number",
  "rating": "string",
  "url": "string",
  "timestamp": "number",
  "userAgent": "string"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | The name of the Web Vital metric. Possible values: `CLS`, `INP`, `FCP`, `LCP`, `TTFB` |
| value | number | Yes | The measured value of the metric |
| rating | string | Yes | The rating of the metric. Possible values: `good`, `needs-improvement`, `poor` |
| url | string | Yes | The URL where the metric was measured |
| timestamp | number | Yes | The timestamp when the metric was measured (milliseconds since epoch) |
| userAgent | string | Yes | The user agent string of the client |

### Web Vitals Metrics

1. **CLS (Cumulative Layout Shift)**: Measures the largest burst of layout shift scores for every unexpected layout shift that occurs during the entire lifespan of a page.
2. **INP (Interaction to Next Paint)**: Measures the latency of a page's first input delay.
3. **FCP (First Contentful Paint)**: Measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.
4. **LCP (Largest Contentful Paint)**: Measures the time from when the page starts loading to when the largest content element is rendered on the screen.
5. **TTFB (Time to First Byte)**: Measures the time from when the browser starts requesting a resource to when it receives the first byte of the response.

## Response Format

### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Web vitals metric recorded"
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
  "error": "Failed to process web vitals metric"
}
```

## Example Request
```bash
curl -X POST https://your-domain.com/api/analytics/web-vitals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LCP",
    "value": 1234.56,
    "rating": "good",
    "url": "https://example.com/page",
    "timestamp": 1678886400000,
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }'
```

## Implementation Details
The endpoint currently logs the received metrics to the console. In a production environment, these metrics would typically be stored in a database or sent to an analytics service for further processing and analysis.

## Related Files
- `app/api/analytics/web-vitals/route.ts` - The implementation of this endpoint
- `src/lib/monitoring.ts` - The frontend implementation that sends data to this endpoint

## Monitoring
Web Vitals data is collected automatically by the frontend application using the `web-vitals` library and sent to this endpoint. The data is used to monitor and improve the user experience of the application.