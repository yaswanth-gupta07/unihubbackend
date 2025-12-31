# Mobile Device Setup Guide

## For Physical Mobile Devices (Not Emulator/Simulator)

When testing on a **physical phone**, you need to configure your computer's IP address.

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter
4. Example: `192.168.1.100` or `192.168.0.105`

**Mac/Linux:**
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for "inet" under your WiFi adapter
4. Example: `192.168.1.100` or `192.168.0.105`

### Step 2: Update api_service.dart

1. Open `lib/services/api_service.dart`
2. Find line 12: `static const String? _customIpAddress = null;`
3. Change it to: `static const String? _customIpAddress = 'YOUR_IP_HERE';`
4. Example: `static const String? _customIpAddress = '192.168.1.100';`

### Step 3: Ensure Same Network

- Make sure your **phone** and **computer** are connected to the **same WiFi network**
- Both devices must be on the same network for this to work

### Step 4: Check Firewall

- Make sure your computer's firewall allows connections on port 5000
- Windows: Allow Node.js through firewall
- Mac: System Preferences → Security → Firewall

### Step 5: Start Your Backend Server

Make sure your Node.js backend server is running:
```bash
cd backend
npm start
# or
node server.js
```

The server should be listening on port 5000.

### Step 6: Test Connection

1. On your phone, open a browser
2. Try to access: `http://YOUR_IP:5000/health`
3. If you see a JSON response, the connection works!

### Troubleshooting

**Still getting timeout errors?**
- Double-check the IP address is correct
- Verify both devices are on same WiFi
- Check if server is actually running
- Try disabling firewall temporarily to test
- Make sure port 5000 is not blocked

**Connection refused?**
- Server might not be running
- Firewall might be blocking
- Wrong IP address

**Works on emulator but not phone?**
- Emulator uses `10.0.2.2` which only works in emulator
- Physical devices MUST use your computer's actual IP address


