# Troubleshooting Guide for Real-time Comments & Likes

## Current Issues

### 1. API 404 Errors
**Error:** `GET http://localhost:5173/api/ideas/2/comments 404 (Not Found)`

**Cause:** The backend Spring Boot server is not running on port 8080, or the Vite proxy isn't forwarding requests correctly.

**Solution:**
1. **Start the backend server:**
   ```bash
   # In the project root directory
   mvn spring-boot:run
   ```
   
2. **Verify backend is running:**
   - Open browser: `http://localhost:8080/api/ideas`
   - Should return JSON with ideas list
   
3. **Restart Vite dev server** (after any config changes):
   ```bash
   cd src/frontend
   npm run dev
   ```

### 2. Socket.io Connection Failed
**Error:** `WebSocket connection to 'ws://localhost:9092/socket.io/...' failed`

**Cause:** The Socket.io server on port 9092 is not running or not accessible.

**Solution:**
1. **Check backend logs** for this message:
   ```
   Socket.io server started on port: 9092
   ```
   
2. **If not present, check:**
   - Backend server is running
   - Port 9092 is not blocked by firewall
   - No other application is using port 9092

3. **Verify Socket.io server started:**
   - Check backend console output when starting
   - Look for any errors during SocketIOServer initialization

## Quick Start Checklist

1. ✅ **Start MySQL database** (if not running)
2. ✅ **Start Spring Boot backend:**
   ```bash
   mvn spring-boot:run
   ```
   Wait for: `Started GamestaApplication` and `Socket.io server started on port: 9092`

3. ✅ **Start Vite frontend:**
   ```bash
   cd src/frontend
   npm install  # If you haven't already
   npm run dev
   ```

4. ✅ **Verify both are running:**
   - Backend: `http://localhost:8080/api/ideas` should return JSON
   - Frontend: `http://localhost:5173` should show the app
   - Socket.io: Check backend logs for startup message

## Testing the Setup

### Test API Endpoint:
```bash
curl http://localhost:8080/api/ideas/2/comments
```

### Test Socket.io Connection:
Open browser console and check for:
- `Socket connected: [socket-id]` (success)
- `Socket connection error` (failure - check backend is running)

## Common Issues

### Vite Proxy Not Working
If API requests still go to `localhost:5173` instead of being proxied:
1. Restart Vite dev server
2. Check `vite.config.js` has correct proxy configuration
3. Try accessing API directly: `http://localhost:8080/api/ideas/2/comments`

### Socket.io Server Not Starting
1. Check `application.properties` has:
   ```
   socketio.host=localhost
   socketio.port=9092
   ```
2. Check backend logs for errors
3. Verify `SocketIOEventListener` is being initialized

### Database Connection Issues
If backend fails to start:
1. Verify MySQL is running
2. Check `application.properties` database credentials
3. Ensure database `gamesta` exists

## Next Steps After Fixes

Once both servers are running:
1. Open the app in browser
2. Sign in to get authentication token
3. Navigate to Ideas page
4. Click "Show Comments" on any idea
5. Try posting a comment
6. Open another browser/incognito window to test real-time updates


