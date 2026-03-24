const defaultIceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

export async function getMediaDevices() {
	const devices = await navigator.mediaDevices.enumerateDevices();

	return {
		audioInputs: devices.filter(({ kind }) => kind === 'audioinput'),
		audioOutputs: devices.filter(({ kind }) => kind === 'audiooutput'),
		videoInputs: devices.filter(({ kind }) => kind === 'videoinput')
	};
}

export function createPeerSession({
	roomId,
	socket,
	localVideo,
	remoteVideo,
	onConnectionStateChange,
	iceServers = defaultIceServers
}) {
	const peerConnection = new RTCPeerConnection({ iceServers });

	peerConnection.onicecandidate = ({ candidate }) => {
		if (!candidate || socket.readyState !== WebSocket.OPEN) return;

		socket.send(
			JSON.stringify({
				type: 'ice-candidate',
				roomId,
				payload: candidate
			})
		);
	};

	peerConnection.ontrack = ({ streams }) => {
		const [remoteStream] = streams;
		if (remoteVideo && remoteStream) {
			remoteVideo.srcObject = remoteStream;
			void remoteVideo.play().catch(() => {});
		}
	};

	peerConnection.onconnectionstatechange = () => {
		onConnectionStateChange?.(peerConnection.connectionState);
	};

	let localStream;

	async function startLocalMedia(constraints) {
		localStream = await navigator.mediaDevices.getUserMedia(constraints);

		if (localVideo) {
			localVideo.srcObject = localStream;
			void localVideo.play().catch(() => {});
		}

		for (const track of localStream.getTracks()) {
			peerConnection.addTrack(track, localStream);
		}

		return localStream;
	}

	async function createOffer() {
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		socket.send(
			JSON.stringify({
				type: 'offer',
				roomId,
				payload: offer
			})
		);
	}

	async function handleSignalMessage({ type, payload }) {
		if (type === 'offer') {
			if (!peerConnection.currentRemoteDescription) {
				await peerConnection.setRemoteDescription(payload);
			}

			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer);

			socket.send(
				JSON.stringify({
					type: 'answer',
					roomId,
					payload: answer
				})
			);
			return;
		}

		if (type === 'answer') {
			if (!peerConnection.currentRemoteDescription) {
				await peerConnection.setRemoteDescription(payload);
			}
			return;
		}

		if (type === 'ice-candidate' && payload) {
			await peerConnection.addIceCandidate(payload);
		}
	}

	function destroy() {
		localStream?.getTracks().forEach((track) => track.stop());
		peerConnection.getSenders().forEach((sender) => sender.track?.stop());
		peerConnection.close();
	}

	return {
		peerConnection,
		startLocalMedia,
		createOffer,
		handleSignalMessage,
		destroy
	};
}
