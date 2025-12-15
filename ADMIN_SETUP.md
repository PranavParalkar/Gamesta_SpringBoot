# Admin Role Setup Guide

## Step 1: Assign Yourself Admin Role

Run this PowerShell command to assign yourself the `SUPER_ADMIN` role. **Replace `YOUR_EMAIL@mitaoe.ac.in` with your actual email address.**

### PowerShell Command:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/admin/manage/assign -Method Post -Headers @{ 'X-Admin-Secret' = 'Pranav273!' } -ContentType 'application/json' -Body '{ "email": "202301100025@mitaoe.ac.in", "role": "SUPER_ADMIN" }'
```

### Example (replace with your email):

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/admin/manage/assign -Method Post -Headers @{ 'X-Admin-Secret' = 'Pranav273!' } -ContentType 'application/json' -Body '{ "email": "202301100025@mitaoe.ac.in", "role": "SUPER_ADMIN" }'
```

### Important Notes:

1. **Make sure your Spring Boot backend is running** on `http://localhost:8080`
2. **Replace `YOUR_EMAIL@mitaoe.ac.in`** with your actual email address that you used to register
3. The command should return a JSON response like:
   ```json
   {
     "status": "updated",
     "userId": 1,
     "role": "SUPER_ADMIN"
   }
   ```

## Step 2: Verify Access

1. **Sign out and sign back in** to your account (to refresh your session token)
2. Navigate to `/admin` in your browser
3. You should now see the Admin Dashboard

## Troubleshooting

- **"unauthorized" error**: Check that the `X-Admin-Secret` header matches `Pranav273!` (as configured in `application.properties`)
- **"user not found" error**: Make sure you're using the exact email address you registered with
- **Still can't access admin page**: 
  - Clear your browser session storage: `sessionStorage.clear()`
  - Sign out and sign back in
  - Check browser console for any errors

## Security

The admin page is now protected and will:
- Redirect non-admin users to the home page
- Show an "Access Denied" message if accessed without proper permissions
- Only display content to users with `ADMIN` or `SUPER_ADMIN` roles

