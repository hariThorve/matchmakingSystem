# Matchmaking System

A simple WebSocket-based matchmaking system that connects patients with doctors in real-time, similar to how Uber connects riders with drivers.

## Features

- **Real-time Communication**: WebSocket-based instant messaging between patients and doctors
- **Patient Portal**: Patients can post medical requirements with location
- **Doctor Portal**: Doctors receive instant notifications for new requests
- **First-Come-First-Served**: The first doctor to accept gets the patient
- **Automatic Rejection**: Other doctors are notified when a request is already accepted
- **Beautiful UI**: Modern, gradient-based interface with smooth animations

## Project Structure

```
matchmakingInitial/
├── server.js          # WebSocket server
├── patient.html       # Patient client interface
├── doctor.html        # Doctor client interface
├── package.json       # Node.js dependencies
└── README.md          # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the `ws` (WebSocket) library.

### 2. Start the WebSocket Server

```bash
node server.js
```

You should see:
```
WebSocket server is running on ws://localhost:8080
```

### 3. Open Client Interfaces

Open the following files in your web browser:

1. **Patient Client**: Open `patient.html` in one browser tab
2. **Doctor 1**: Open `doctor.html` in a second browser tab
3. **Doctor 2**: Open `doctor2.html` in a third browser tab (or new window)


## How to Test

### Basic Flow

1. **Verify Connections**: Check that all three clients show "Connected" status
2. **Post a Requirement**: 
   - Go to the patient tab
   - Fill in the form (default values are provided)
   - Click "Post Requirement"
3. **Check Doctor Notifications**:
   - Both doctor tabs should receive a notification
   - Check the browser console to see the console logs
4. **Accept Request**:
   - Click "Accept Request" on one doctor's interface
   - The patient should see the doctor's name
   - The other doctor should see "already accepted" message

### Console Logs

The system provides detailed console logs:

**Server Console:**
```
📢 NEW REQUEST from John Doe:
   Description: Need consultation for fever and headache
   Location: Downtown, 5th Avenue
   Broadcasting to 2 doctors...
   ✉️  Notifying Dr. Smith
   ✉️  Notifying Dr. Johnson

✅ REQUEST ACCEPTED by Dr. Smith
```

**Doctor Console:**
```
🔔 NEW REQUEST from John Doe!
   Description: Need consultation for fever and headache
   Location: Downtown, 5th Avenue
```

## Architecture

### WebSocket Events

#### Client → Server

- `REGISTER`: Register as patient or doctor
- `POST_REQUIREMENT`: Patient posts a new requirement
- `ACCEPT_REQUEST`: Doctor accepts a request

#### Server → Client

- `REGISTERED`: Confirmation of registration
- `NEW_REQUEST`: Notification to doctors about new patient request
- `REQUEST_POSTED`: Confirmation to patient that request was posted
- `REQUEST_ACCEPTED`: Notification to patient about matched doctor
- `ACCEPTANCE_CONFIRMED`: Confirmation to accepting doctor
- `REQUEST_ALREADY_ACCEPTED`: Rejection to other doctors
- `ERROR`: Error messages

### Data Flow

```
Patient posts requirement
        ↓
Server receives POST_REQUIREMENT
        ↓
Server broadcasts NEW_REQUEST to all doctors
        ↓
Doctor 1 clicks Accept (first)
        ↓
Server sends ACCEPTANCE_CONFIRMED to Doctor 1
Server sends REQUEST_ACCEPTED to Patient
Server sends REQUEST_ALREADY_ACCEPTED to Doctor 2
```

## Customization

### Change Doctor Names

Edit the `doctorName` input value in `doctor.html`:

```html
<input type="text" id="doctorName" value="Dr. Johnson" readonly>
```

### Change Server Port

Edit the `PORT` constant in `server.js`:

```javascript
const PORT = 8080;
```

Also update the WebSocket URL in both HTML files:

```javascript
ws = new WebSocket('ws://localhost:8080');
```

### Add More Doctors

Simply open `doctor.html` in additional browser tabs or windows. Each instance will automatically get a unique ID.

## Future Enhancements

- Real geolocation using browser GPS
- Distance calculation between patient and doctors
- Filter doctors by specialty
- Chat functionality between matched patient and doctor
- Request history and analytics
- Database persistence
- Authentication and authorization

## Technologies Used

- **Backend**: Node.js with `ws` library
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Communication**: WebSocket protocol
- **Styling**: CSS3 with gradients and animations

## Troubleshooting

### "Not connected to server" error

- Make sure the server is running (`npm start`)
- Check that the port 8080 is not in use by another application
- Verify the WebSocket URL is correct in the HTML files

### Doctors not receiving notifications

- Check browser console for errors
- Verify all clients show "Connected" status
- Make sure you registered as a doctor (should see success alert)

### Request already accepted immediately

- The system resets after 2 seconds
- Wait for the "System ready for new requests" message in server console
- Refresh the doctor pages if needed

## License

ISC
