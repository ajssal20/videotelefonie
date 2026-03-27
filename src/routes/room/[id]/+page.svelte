<script>
	import { env } from '$env/dynamic/public';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { createPeerSession } from '$lib/rtc.js';

	let { data } = $props();

	let localVideo;
	let remoteVideo;
	let socket;
	let session;
	let status = $state('Bereit');
	let error = $state('');
	let joined = $state(false);
	let mediaStarted = $state(false);
	let copied = $state(false);

	const roomId = $derived(data.roomId);
	const signalUrl = env.PUBLIC_SIGNAL_URL || 'ws://localhost:8080';

	onMount(() => {
		let cancelled = false;

		try {
			socket = new WebSocket(signalUrl);

			socket.addEventListener('open', () => {
				if (!cancelled) {
					status = 'Mit Signaling-Server verbunden';
					error = '';
				}
			});

			socket.addEventListener('message', async ({ data: rawData }) => {
				try {
					const message = JSON.parse(rawData);

					await ensureSession();

					if (message.type === 'peer-ready') {
						await ensureLocalMedia();
						status = 'Zweiter Teilnehmer beigetreten. Angebot wird erstellt...';
						await session.createOffer();
						return;
					}

					if (message.type === 'offer') {
						await ensureLocalMedia();
					}

					await session.handleSignalMessage(message);
				} catch (cause) {
					error = cause instanceof Error ? cause.message : 'Signal konnte nicht verarbeitet werden';
				}
			});

			socket.addEventListener('close', () => {
				if (!cancelled) {
					status = 'Signaling getrennt';
					if (joined) {
						error = `Der Signaling-Server auf ${signalUrl} ist nicht erreichbar.`;
					}
				}
			});

			socket.addEventListener('error', () => {
				if (!cancelled) {
					error = `Der Signaling-Server auf ${signalUrl} ist nicht erreichbar.`;
				}
			});
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Unbekannter Fehler';
			status = 'Fehler';
		}

		return () => {
			cancelled = true;
			socket?.close();
			session?.destroy();
		};
	});

	const ensureSession = async () => {
		if (session) {
			session.setLocalVideoElement(localVideo);
			session.setRemoteVideoElement(remoteVideo);
			return session;
		}

		session = createPeerSession({
			roomId,
			socket,
			localVideo,
			remoteVideo,
			onConnectionStateChange: (nextState) => {
				status = `Verbindungsstatus: ${nextState}`;
			}
		});

		return session;
	};

	$effect(() => {
		if (!session) return;

		session.setLocalVideoElement(localVideo);
		session.setRemoteVideoElement(remoteVideo);
	});

	const ensureLocalMedia = async () => {
		await ensureSession();

		if (mediaStarted) {
			return;
		}

		await session.startLocalMedia({
			video: true,
			audio: true
		});
		mediaStarted = true;
		status = 'Lokale Kamera aktiv.';
	};

	const startSession = async () => {
		error = '';
		copied = false;

		try {
			await ensureSession();
			await ensureLocalMedia();

			if (!socket || socket.readyState !== WebSocket.OPEN) {
				error = `Der Signaling-Server auf ${signalUrl} ist nicht erreichbar.`;
				status = 'Lokale Kamera aktiv, aber Server nicht erreichbar';
				return;
			}

			if (!joined) {
				socket.send(JSON.stringify({ type: 'join', roomId }));
				joined = true;
			}

			status = 'Lokale Kamera aktiv. Warte auf weiteren Teilnehmer...';
		} catch (cause) {
			error =
				cause instanceof Error
					? cause.message
					: 'Kamera oder Mikrofon konnten nicht gestartet werden.';
			status = 'Medienstart fehlgeschlagen';
		}
	};

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(roomId);
			copied = true;
		} catch {
			copied = false;
			error = 'Der Klassen-Code konnte nicht in die Zwischenablage kopiert werden.';
		}
	};
</script>

<svelte:head>
	<title>Raum {roomId}</title>
</svelte:head>

<div class="room-shell">
	<div class="flare flare-one"></div>
	<div class="flare flare-two"></div>
	<div class="mesh"></div>

	<div class="room-content">
		<section class="hero-panel reveal reveal-1">
			<div class="hero-copy">
				<p class="eyebrow">Showroom Call</p>
				<h1>Raum <span>{roomId}</span></h1>
				<p class="hero-text">
					Ein auffaelliger Videoraum mit kraeftigen Warmtoenen, klaren Aktionen und einer starken
					Live-Buehne fuer Unterricht oder Meetings.
				</p>

				<div class="status-ribbon">
					<div class="status-dot"></div>
					<p>{status}</p>
				</div>

				{#if error}
					<div class="alert-banner">
						<strong>Verbindungshinweis</strong>
						<p>{error}</p>
					</div>
				{/if}
			</div>

			<div class="hero-actions">
				<button type="button" class="primary-button" onclick={startSession}>
					Kamera und Mikrofon starten
				</button>
				<button type="button" class="ghost-button" onclick={copyCode}>
					{copied ? 'Code kopiert' : 'Code kopieren'}
				</button>
				<a href={resolve('/')} class="text-link">Startseite</a>
				<a href={resolve('/settings')} class="text-link accent-link">Einstellungen</a>
			</div>
		</section>

		<section class="info-strip reveal reveal-2">
			<div class="info-card">
				<span>01</span>
				<p>Teile den Klassen-Code mit allen Teilnehmern.</p>
			</div>
			<div class="info-card">
				<span>02</span>
				<p>Starte Kamera und Mikrofon direkt im Raum.</p>
			</div>
			<div class="info-card">
				<span>03</span>
				<p>Das zweite Video erscheint automatisch, sobald jemand beitritt.</p>
			</div>
		</section>

		<section class="video-grid">
			<article class="video-card reveal reveal-3">
				<div class="card-topline">
					<p>Deine Kamera</p>
					<span>{mediaStarted ? 'Live' : 'Standby'}</span>
				</div>
				<div class="video-frame">
					<video bind:this={localVideo} autoplay muted playsinline></video>
					<div class="video-overlay">
						<div class="pulse-ring"></div>
						<p>{mediaStarted ? 'Lokale Vorschau aktiv' : 'Noch nicht gestartet'}</p>
					</div>
				</div>
			</article>

			<article class="video-card reveal reveal-4">
				<div class="card-topline">
					<p>Anderer Teilnehmer</p>
					<span>Remote</span>
				</div>
				<div class="video-frame remote-frame">
					<video bind:this={remoteVideo} autoplay playsinline></video>
					<div class="video-overlay">
						<div class="pulse-ring alt-ring"></div>
						<p>Wird sichtbar, sobald jemand mit demselben Code beitritt</p>
					</div>
				</div>
			</article>

			<aside class="side-panel reveal reveal-5">
				<p class="side-label">Setup</p>
				<h2>Medien und Signal sauber getrennt</h2>
				<p>
					Die lokale Kamera startet auch dann, wenn der Signaling-Server noch nicht antwortet.
					Dadurch erkennst du sofort, ob der Fehler beim Browser oder beim Server liegt.
				</p>

				<div class="tip-box">
					<p class="tip-title">Tipp bei schwarzem Video</p>
					<p>
						Pruefe Kamera-Berechtigung im Browser und stelle sicher, dass parallel
						`npm run dev:signal` aktiv ist.
					</p>
				</div>

				<div class="endpoint-box">
					<p>Signal-Endpunkt</p>
					<code>{signalUrl}</code>
				</div>
			</aside>
		</section>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
		background:
			radial-gradient(circle at top, rgba(255, 96, 126, 0.18), transparent 28%),
			radial-gradient(circle at 84% 18%, rgba(255, 179, 71, 0.18), transparent 24%),
			radial-gradient(circle at 52% 100%, rgba(214, 255, 102, 0.1), transparent 24%),
			linear-gradient(145deg, #140811 0%, #2b0d1a 42%, #14090a 100%);
		color: #fff7f2;
	}

	.room-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		padding: 40px 20px 64px;
	}

	.room-content {
		position: relative;
		z-index: 2;
		margin: 0 auto;
		max-width: 1320px;
	}

	.flare,
	.mesh {
		pointer-events: none;
		position: absolute;
	}

	.flare {
		border-radius: 999px;
		filter: blur(34px);
		animation: drift 12s ease-in-out infinite;
	}

	.flare-one {
		top: -140px;
		left: -90px;
		height: 420px;
		width: 420px;
		background: radial-gradient(circle, rgba(255, 91, 148, 0.76) 0%, rgba(255, 91, 148, 0) 68%);
	}

	.flare-two {
		right: -120px;
		bottom: 10%;
		height: 360px;
		width: 360px;
		background: radial-gradient(circle, rgba(255, 196, 80, 0.58) 0%, rgba(255, 196, 80, 0) 68%);
		animation-direction: reverse;
	}

	.mesh {
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
		background-size: 90px 90px;
		mask-image: radial-gradient(circle at center, black 34%, transparent 86%);
		opacity: 0.24;
	}

	.hero-panel,
	.info-card,
	.video-card,
	.side-panel {
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: linear-gradient(180deg, rgba(58, 18, 30, 0.78), rgba(18, 7, 9, 0.86));
		backdrop-filter: blur(18px);
		box-shadow:
			0 24px 80px rgba(16, 4, 8, 0.46),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.hero-panel {
		display: grid;
		gap: 32px;
		border-radius: 34px;
		padding: 34px;
	}

	.eyebrow,
	.side-label {
		margin: 0 0 10px;
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: #ffb76e;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.8rem, 8vw, 6.2rem);
		line-height: 0.95;
		letter-spacing: -0.05em;
	}

	h1 span {
		display: inline-block;
		background: linear-gradient(90deg, #fff4db 0%, #ff8f7a 42%, #d7ff73 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: 0 0 24px rgba(255, 186, 91, 0.18);
	}

	.hero-text,
	.side-panel p,
	.info-card p,
	.alert-banner p {
		margin: 0;
		color: rgba(255, 240, 233, 0.78);
		line-height: 1.7;
	}

	.hero-copy {
		display: grid;
		gap: 20px;
	}

	.status-ribbon,
	.alert-banner,
	.tip-box,
	.endpoint-box {
		border-radius: 22px;
	}

	.status-ribbon {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		gap: 12px;
		padding: 12px 18px;
		background: linear-gradient(90deg, rgba(255, 165, 84, 0.16), rgba(212, 255, 108, 0.12));
		border: 1px solid rgba(255, 190, 94, 0.24);
	}

	.status-ribbon p {
		margin: 0;
		font-weight: 600;
	}

	.status-dot {
		height: 12px;
		width: 12px;
		border-radius: 999px;
		background: #d1ff6b;
		box-shadow: 0 0 0 0 rgba(209, 255, 107, 0.54);
		animation: pulse 1.8s infinite;
	}

	.alert-banner {
		padding: 16px 18px;
		background: linear-gradient(135deg, rgba(255, 93, 136, 0.16), rgba(255, 173, 77, 0.14));
		border: 1px solid rgba(255, 149, 105, 0.22);
	}

	.alert-banner strong,
	.tip-title,
	.card-topline p,
	.endpoint-box p,
	.info-card span,
	.card-topline span,
	h2 {
		margin: 0;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		align-items: center;
	}

	.primary-button,
	.ghost-button,
	.text-link {
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			border-color 180ms ease,
			background 180ms ease;
	}

	.primary-button,
	.ghost-button {
		border: 0;
		cursor: pointer;
		border-radius: 999px;
		padding: 15px 24px;
		font-weight: 700;
	}

	.primary-button {
		background: linear-gradient(120deg, #ff8b64 0%, #ff5f90 48%, #ffe76a 100%);
		color: #2a0811;
		box-shadow: 0 18px 32px rgba(255, 132, 116, 0.28);
	}

	.ghost-button {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.14);
		color: #fff1ea;
	}

	.text-link {
		padding: 12px 2px;
		color: #ffdcb8;
		text-decoration: none;
		font-weight: 600;
	}

	.accent-link {
		color: #d8ff78;
	}

	.primary-button:hover,
	.ghost-button:hover,
	.text-link:hover {
		transform: translateY(-2px);
	}

	.info-strip {
		display: grid;
		gap: 16px;
		margin-top: 22px;
	}

	.info-card {
		border-radius: 26px;
		padding: 20px;
	}

	.info-card span {
		display: inline-flex;
		margin-bottom: 14px;
		font-size: 1.8rem;
		font-weight: 800;
		background: linear-gradient(180deg, #ffd168 0%, #ff7098 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.video-grid {
		display: grid;
		gap: 20px;
		margin-top: 22px;
	}

	.video-card,
	.side-panel {
		border-radius: 30px;
		padding: 20px;
	}

	.card-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.card-topline p {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.card-topline span {
		border-radius: 999px;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.06);
		color: #ffe07b;
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
	}

	.video-frame {
		position: relative;
		overflow: hidden;
		border-radius: 24px;
		aspect-ratio: 16 / 10;
		background:
			radial-gradient(circle at top, rgba(255, 177, 88, 0.16), transparent 30%),
			linear-gradient(145deg, #0b0405 0%, #231016 100%);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.remote-frame {
		background:
			radial-gradient(circle at top right, rgba(211, 255, 101, 0.12), transparent 24%),
			linear-gradient(145deg, #12070d 0%, #2d1321 100%);
	}

	video {
		height: 100%;
		width: 100%;
		object-fit: cover;
		background: rgba(0, 0, 0, 0.42);
	}

	.video-overlay {
		pointer-events: none;
		position: absolute;
		inset: auto 16px 16px 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		border-radius: 18px;
		padding: 12px 14px;
		background: linear-gradient(90deg, rgba(25, 10, 13, 0.88), rgba(57, 19, 31, 0.62));
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.video-overlay p {
		margin: 0;
		font-size: 0.92rem;
		color: rgba(255, 241, 235, 0.82);
	}

	.pulse-ring {
		flex: 0 0 14px;
		height: 14px;
		width: 14px;
		border-radius: 999px;
		background: #ffe36f;
		box-shadow: 0 0 18px rgba(255, 227, 111, 0.68);
	}

	.alt-ring {
		background: #d6ff6f;
		box-shadow: 0 0 18px rgba(214, 255, 111, 0.68);
	}

	h2 {
		font-size: 1.8rem;
		line-height: 1.1;
	}

	.tip-box,
	.endpoint-box {
		margin-top: 18px;
		padding: 18px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tip-title,
	.endpoint-box p {
		margin-bottom: 8px;
		font-weight: 700;
		color: #fff6e7;
	}

	.endpoint-box code {
		display: block;
		overflow-wrap: anywhere;
		font-size: 0.92rem;
		color: #ffb867;
	}

	.reveal {
		opacity: 0;
		transform: translateY(26px) scale(0.985);
		animation: reveal 700ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
	}

	.reveal-2 {
		animation-delay: 120ms;
	}

	.reveal-3 {
		animation-delay: 220ms;
	}

	.reveal-4 {
		animation-delay: 320ms;
	}

	.reveal-5 {
		animation-delay: 420ms;
	}

	@media (min-width: 760px) {
		.hero-panel {
			grid-template-columns: 1.3fr 0.8fr;
			align-items: end;
		}

		.info-strip {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.video-grid {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 360px;
			align-items: start;
		}
	}

	@media (max-width: 759px) {
		.room-shell {
			padding-inline: 14px;
		}

		.hero-panel,
		.video-card,
		.side-panel,
		.info-card {
			border-radius: 24px;
		}

		h1 {
			font-size: 3.2rem;
		}
	}

	@keyframes reveal {
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes drift {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		50% {
			transform: translate3d(16px, -22px, 0) scale(1.08);
		}
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(209, 255, 107, 0.56);
		}
		70% {
			box-shadow: 0 0 0 14px rgba(209, 255, 107, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(209, 255, 107, 0);
		}
	}
</style>
