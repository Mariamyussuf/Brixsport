# Analytics WebSocket API

## Overview
The Analytics WebSocket API provides real-time updates for dashboard metrics and live analytics data.

## Connection
To connect to the WebSocket server, use the same base URL as the REST API with a WebSocket connection:

```
ws://localhost:4000
```

## Events

### Client to Server

#### `analytics:subscribeLiveMetrics`
Subscribe to live metrics updates.

**Example:**
```javascript
socket.emit('analytics:subscribeLiveMetrics');
```

#### `analytics:unsubscribeLiveMetrics`
Unsubscribe from live metrics updates.

**Example:**
```javascript
socket.emit('analytics:unsubscribeLiveMetrics');
```

#### `analytics:requestLiveMetrics`
Request a one-time update of live metrics.

**Example:**
```javascript
socket.emit('analytics:requestLiveMetrics');
```

#### `analytics:joinDashboard`
Join a specific dashboard room for targeted updates.

**Parameters:**
- `dashboardId` (string): The ID of the dashboard to join

**Example:**
```javascript
socket.emit('analytics:joinDashboard', 'dashboard_123');
```

#### `analytics:leaveDashboard`
Leave a specific dashboard room.

**Parameters:**
- `dashboardId` (string): The ID of the dashboard to leave

**Example:**
```javascript
socket.emit('analytics:leaveDashboard', 'dashboard_123');
```

### Server to Client

#### `analytics:liveMetrics`
Live metrics data sent to subscribed clients.

**Data Format:**
```json
[
  {
    "name": "Active Users",
    "value": 1245,
    "timestamp": "2023-10-01T10:00:00.000Z"
  },
  {
    "name": "CPU Usage",
    "value": 68,
    "timestamp": "2023-10-01T10:00:00.000Z"
  }
]
```

#### `analytics:error`
Error messages sent to clients.

**Data Format:**
```json
{
  "message": "Error description"
}
```

## Testing

To test the WebSocket functionality:

1. Connect to the WebSocket server using a WebSocket client
2. Emit `analytics:subscribeLiveMetrics` to start receiving updates
3. Emit `analytics:requestLiveMetrics` to request a one-time update
4. Emit `analytics:unsubscribeLiveMetrics` to stop receiving updates

### Example using JavaScript
```javascript
const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to live metrics
  socket.emit('analytics:subscribeLiveMetrics');
});

socket.on('analytics:liveMetrics', (data) => {
  console.log('Live metrics received:', data);
});

socket.on('analytics:error', (error) => {
  console.error('Analytics error:', error);
});
```