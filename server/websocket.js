import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map();

function ensureRoom(roomId) {
	if (!rooms.has(roomId)) {
		rooms.set(roomId, new Set());
	}

	return rooms.get(roomId);
}

function broadcastToRoom(roomId, sender, message) {
	const peers = rooms.get(roomId);
	if (!peers) return;

	for (const peer of peers) {
		if (peer !== sender && peer.readyState === peer.OPEN) {
			peer.send(JSON.stringify(message));
		}
	}
}

wss.on('connection', (socket) => {
	let activeRoomId = null;

	socket.on('message', (rawMessage) => {
		const message = JSON.parse(rawMessage);
		const { type, roomId, payload } = message;

		if (type === 'join') {
			activeRoomId = roomId;
			const peers = ensureRoom(roomId);
			peers.add(socket);

			if (peers.size > 1) {
				broadcastToRoom(roomId, socket, { type: 'peer-ready' });
			}

			return;
		}

		if (!activeRoomId) return;

		if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
			broadcastToRoom(activeRoomId, socket, { type, payload });
		}
	});

	socket.on('close', () => {
		if (!activeRoomId) return;

		const peers = rooms.get(activeRoomId);
		if (!peers) return;

		peers.delete(socket);

		if (peers.size === 0) {
			rooms.delete(activeRoomId);
		}
	});
});

console.log('WebSocket signaling server running on ws://localhost:8080');
