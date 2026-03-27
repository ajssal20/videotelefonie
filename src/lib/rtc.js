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
	let localVideoElement = localVideo;
	let remoteVideoElement = remoteVideo;
	let localStream;
	const remoteStream = new MediaStream();
	const pendingIceCandidates = [];

	function attachVideoStream(videoElement, stream, { muted = false } = {}) {
		if (!videoElement || !stream) return;

		videoElement.srcObject = stream;
		videoElement.muted = muted;
		void videoElement.play().catch(() => {});
	}

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

	peerConnection.ontrack = ({ track, streams }) => {
		const [remoteStream] = streams;

		if (remoteStream) {
			for (const streamTrack of remoteStream.getTracks()) {
				if (!remoteStreamHasTrack(streamTrack.id)) {
					remoteStream.addTrack(streamTrack);
				}
			}
		} else if (track && !remoteStreamHasTrack(track.id)) {
			remoteStream.addTrack(track);
		}

		track?.addEventListener('unmute', () => {
			attachVideoStream(remoteVideoElement, remoteStream);
		});

		attachVideoStream(remoteVideoElement, remoteStream);
	};

	peerConnection.onconnectionstatechange = () => {
		onConnectionStateChange?.(peerConnection.connectionState);
	};

	function remoteStreamHasTrack(trackId) {
		return remoteStream.getTracks().some((streamTrack) => streamTrack.id === trackId);
	}

	async function applyRemoteDescription(description) {
		if (!description || peerConnection.currentRemoteDescription) return;

		await peerConnection.setRemoteDescription(description);

		while (pendingIceCandidates.length > 0) {
			const candidate = pendingIceCandidates.shift();
			await peerConnection.addIceCandidate(candidate);
		}
	}

	async function startLocalMedia(constraints) {
		localStream = await navigator.mediaDevices.getUserMedia(constraints);

		attachVideoStream(localVideoElement, localStream, { muted: true });

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
			await applyRemoteDescription(payload);

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
			await applyRemoteDescription(payload);
			return;
		}

		if (type === 'ice-candidate' && payload) {
			if (!peerConnection.currentRemoteDescription) {
				pendingIceCandidates.push(payload);
				return;
			}

			await peerConnection.addIceCandidate(payload);
		}
	}

	function setLocalVideoElement(videoElement) {
		localVideoElement = videoElement;

		if (localStream) {
			attachVideoStream(localVideoElement, localStream, { muted: true });
		}
	}

	function setRemoteVideoElement(videoElement) {
		remoteVideoElement = videoElement;

		if (remoteStream.getTracks().length > 0) {
			attachVideoStream(remoteVideoElement, remoteStream);
		}
	}

	function destroy() {
		localStream?.getTracks().forEach((track) => track.stop());
		remoteStream.getTracks().forEach((track) => track.stop());
		peerConnection.getSenders().forEach((sender) => sender.track?.stop());
		peerConnection.close();
	}

	return {
		peerConnection,
		startLocalMedia,
		createOffer,
		handleSignalMessage,
		setLocalVideoElement,
		setRemoteVideoElement,
		destroy
	};
}
