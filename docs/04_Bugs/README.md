# 🐛 Bugs & Fixes

Document tricky bugs and their solutions. Writing them down saves you time when you inevitably run into the same issue again 6 months later!

## Example Entry:
- **Error**: Hydration failed because the initial UI does not match what was rendered on the server.
- **Cause**: Rendering a date directly on the server that differs from the client timezone.
- **Fix**: Used a `useEffect` to only render the formatted date after the component mounted on the client.
