const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store connected clients
const patients = new Map(); // Map<ws, {id, name}>
const doctors = new Map();  // Map<ws, {id, name, location}>

// Track active requests
let activeRequest = null; // {patientId, requestId, description, accepted: false}

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);

            switch (data.type) {
                case 'REGISTER':
                    handleRegistration(ws, data);
                    break;

                case 'POST_REQUIREMENT':
                    handlePostRequirement(ws, data);
                    break;

                case 'ACCEPT_REQUEST':
                    handleAcceptRequest(ws, data);
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove from patients or doctors
        patients.delete(ws);
        doctors.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleRegistration(ws, data) {
    const { role, name, id, location } = data;

    if (role === 'patient') {
        patients.set(ws, { id, name });
        console.log(`Patient registered: ${name} (${id})`);
        ws.send(JSON.stringify({
            type: 'REGISTERED',
            role: 'patient',
            message: 'Successfully registered as patient'
        }));
    } else if (role === 'doctor') {
        doctors.set(ws, { id, name, location });
        console.log(`Doctor registered: ${name} (${id}) at ${location}`);
        ws.send(JSON.stringify({
            type: 'REGISTERED',
            role: 'doctor',
            message: 'Successfully registered as doctor'
        }));
    }
}

function handlePostRequirement(ws, data) {
    const patient = patients.get(ws);

    if (!patient) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'You must register as a patient first'
        }));
        return;
    }

    // Create new request
    const requestId = Date.now().toString();
    activeRequest = {
        patientId: patient.id,
        patientName: patient.name,
        requestId,
        description: data.description,
        location: data.location,
        accepted: false,
        acceptedBy: null
    };

    console.log(`\n📢 NEW REQUEST from ${patient.name}:`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Location: ${data.location}`);
    console.log(`   Broadcasting to ${doctors.size} doctors...\n`);

    // Broadcast to all doctors
    doctors.forEach((doctor, doctorWs) => {
        console.log(`   ✉️  Notifying Dr. ${doctor.name}`);
        doctorWs.send(JSON.stringify({
            type: 'NEW_REQUEST',
            requestId,
            patientName: patient.name,
            description: data.description,
            location: data.location
        }));
    });

    // Confirm to patient
    ws.send(JSON.stringify({
        type: 'REQUEST_POSTED',
        message: 'Your requirement has been posted to nearby doctors',
        requestId
    }));
}

function handleAcceptRequest(ws, data) {
    const doctor = doctors.get(ws);

    if (!doctor) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'You must register as a doctor first'
        }));
        return;
    }

    if (!activeRequest) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'No active request to accept'
        }));
        return;
    }

    if (activeRequest.requestId !== data.requestId) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Request ID mismatch'
        }));
        return;
    }

    // Check if already accepted
    if (activeRequest.accepted) {
        console.log(`❌ Dr. ${doctor.name} tried to accept, but already accepted by Dr. ${activeRequest.acceptedBy}`);
        ws.send(JSON.stringify({
            type: 'REQUEST_ALREADY_ACCEPTED',
            message: `This request has already been accepted by Dr. ${activeRequest.acceptedBy}`,
            acceptedBy: activeRequest.acceptedBy
        }));
        return;
    }

    // Accept the request
    activeRequest.accepted = true;
    activeRequest.acceptedBy = doctor.name;

    console.log(`\n✅ REQUEST ACCEPTED by Dr. ${doctor.name}\n`);

    // Notify the accepting doctor
    ws.send(JSON.stringify({
        type: 'ACCEPTANCE_CONFIRMED',
        message: 'You have successfully accepted the request',
        patientName: activeRequest.patientName
    }));

    // Notify the patient
    patients.forEach((patient, patientWs) => {
        if (patient.id === activeRequest.patientId) {
            patientWs.send(JSON.stringify({
                type: 'REQUEST_ACCEPTED',
                doctorName: doctor.name,
                doctorId: doctor.id,
                message: `Dr. ${doctor.name} has accepted your request!`
            }));
        }
    });

    // Notify other doctors that request is no longer available
    doctors.forEach((otherDoctor, otherDoctorWs) => {
        if (otherDoctor.id !== doctor.id) {
            console.log(`   ℹ️  Notifying Dr. ${otherDoctor.name} that request was accepted by another doctor`);
            otherDoctorWs.send(JSON.stringify({
                type: 'REQUEST_ALREADY_ACCEPTED',
                message: `This request has been accepted by Dr. ${doctor.name}`,
                acceptedBy: doctor.name
            }));
        }
    });

    // Reset active request after a delay (for testing purposes)
    setTimeout(() => {
        activeRequest = null;
        console.log('\n🔄 System ready for new requests\n');
    }, 2000);
}
