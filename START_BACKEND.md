# How to Start the Backend Server

## The Problem
You're seeing 404 errors because **the backend Spring Boot server is not running**. The frontend is trying to connect to:
- API: `http://localhost:8080` (Spring Boot REST API)
- Socket.io: `http://localhost:9092` (Socket.io server)

Both need to be running for the application to work.

## Solution: Start the Backend

### Option 1: Using Maven (Command Line)

1. **Open a new terminal/command prompt**
2. **Navigate to project root:**
   ```bash
   cd D:\Projects\Gamesta_SpringBoot
   ```

3. **Start the backend:**
   ```bash
   mvn spring-boot:run
   ```
   
   **OR if Maven is not in PATH, use full path:**
   ```bash
   # Find your Maven installation and use:
   "C:\Program Files\Apache\maven\bin\mvn.cmd" spring-boot:run
   ```

4. **Wait for these messages:**
   ```
   Started GamestaApplication
   Socket.io server started on port: 9092
   ```

### Option 2: Using IDE (IntelliJ IDEA / Eclipse / VS Code)

1. **Open the project in your IDE**
2. **Find the main class:** `GamestaApplication.java`
3. **Right-click → Run 'GamestaApplication'**
4. **Check console for startup messages**

### Option 3: Using Maven Wrapper (if available)

```bash
./mvnw spring-boot:run
# or on Windows:
mvnw.cmd spring-boot:run
```

## Verify Backend is Running

### Test 1: Check API Endpoint
Open browser: `http://localhost:8080/api/ideas`
- ✅ **Success:** Should return JSON with ideas list
- ❌ **Failure:** Connection refused / Can't reach page

### Test 2: Check Socket.io Server
Look at backend console logs for:
- ✅ `Socket.io server started on port: 9092`
- ❌ If missing, check for errors in logs

### Test 3: Check Comments Endpoint
Open browser: `http://localhost:8080/api/ideas/2/comments`
- ✅ **Success:** Returns JSON (empty array `{"data":[]}` if no comments)
- ❌ **404:** Idea ID 2 doesn't exist, try with a valid idea ID
- ❌ **Connection refused:** Backend not running

## Common Issues

### Issue: Port 8080 Already in Use
**Error:** `Port 8080 is already in use`

**Solution:**
1. Find what's using port 8080:
   ```bash
   netstat -ano | findstr :8080
   ```
2. Kill the process or change port in `application.properties`:
   ```
   server.port=8081
   ```

### Issue: Port 9092 Already in Use
**Error:** Socket.io server fails to start

**Solution:**
1. Change Socket.io port in `application.properties`:
   ```
   socketio.port=9093
   ```
2. Update frontend `useSocket.ts`:
   ```typescript
   const DEFAULT_SOCKET_URL = "http://localhost:9093";
   ```

### Issue: Database Connection Failed
**Error:** `Cannot connect to MySQL`

**Solution:**
1. Make sure MySQL is running
2. Check `application.properties` database credentials
3. Verify database `gamesta` exists

### Issue: Socket.io Server Not Starting
**Check:**
1. Backend console for errors
2. `SocketIOEventListener` is being initialized
3. No port conflicts

## Quick Checklist

- [ ] MySQL database is running
- [ ] Backend server started (`mvn spring-boot:run`)
- [ ] See "Started GamestaApplication" in console
- [ ] See "Socket.io server started on port: 9092" in console
- [ ] Can access `http://localhost:8080/api/ideas` in browser
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] No 404 errors in browser console

## Once Backend is Running

1. **Refresh the frontend** (`http://localhost:5173`)
2. **Sign in** to get authentication token
3. **Navigate to Ideas page**
4. **Click "Show Comments"** on any idea
5. **Try posting a comment** - should work now!

## Still Having Issues?

1. Check backend console for error messages
2. Verify all dependencies are installed (`mvn dependency:resolve`)
3. Check Java version (needs Java 17+)
4. Review `TROUBLESHOOTING.md` for more details

