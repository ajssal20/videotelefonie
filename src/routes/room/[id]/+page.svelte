<script>
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
	const signalUrl =
		typeof window === 'undefined'
			? 'ws://localhost:8080'
			: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`;

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
				if (!session) return;

				try {
					const message = JSON.parse(rawData);

					if (message.type === 'peer-ready') {
						status = 'Zweiter Teilnehmer beigetreten. Angebot wird erstellt...';
						await session.createOffer();
						return;
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

	const startSession = async () => {
		error = '';
		copied = false;

		try {
			if (!session) {
				session = createPeerSession({
					roomId,
					socket,
					localVideo,
					remoteVideo,
					onConnectionStateChange: (nextState) => {
						status = `Verbindungsstatus: ${nextState}`;
					}
				});
			}

			if (!mediaStarted) {
				await session.startLocalMedia({
					video: true,
					audio: true
				});
				mediaStarted = true;
				status = 'Lokale Kamera aktiv.';
			}

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

<div class="min-h-screen bg-slate-950 px-6 py-10 text-white">
	<div class="mx-auto max-w-6xl space-y-6">
		<div
			class="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 lg:flex-row lg:items-end lg:justify-between"
		>
			<div>
				<p class="text-sm tracking-[0.3em] text-cyan-300 uppercase">Klassen-Code</p>
				<h1 class="mt-2 text-3xl font-bold uppercase">{roomId}</h1>
				<p class="mt-2 text-sm text-slate-300">{status}</p>
				{#if error}
					<p class="mt-2 text-sm text-rose-300">{error}</p>
				{/if}
			</div>

			<div class="flex flex-wrap gap-3 text-sm">
				<button
					type="button"
					onclick={copyCode}
					class="rounded-2xl border border-cyan-300/30 px-4 py-3 text-cyan-100"
				>
					{copied ? 'Code kopiert' : 'Code kopieren'}
				</button>
				<button
					type="button"
					onclick={startSession}
					class="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
				>
					Kamera und Mikrofon starten
				</button>
				<a href={resolve('/')} class="rounded-2xl border border-white/10 px-4 py-3 text-slate-200"
					>Start</a
				>
				<a
					href={resolve('/settings')}
					class="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
				>
					Einstellungen
				</a>
			</div>
		</div>

		<div class="grid gap-6 xl:grid-cols-[0.8fr_1.2fr_1.2fr]">
			<section class="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
				<h2 class="text-lg font-semibold">So funktioniert es</h2>
				<ol class="space-y-3 text-sm text-slate-300">
					<li>1. Lehrkraft erstellt oder teilt diesen Klassen-Code.</li>
					<li>2. Jeder Teilnehmer tritt ueber die Startseite mit demselben Code bei.</li>
					<li>3. Im Raum auf "Kamera und Mikrofon starten" klicken.</li>
				</ol>

				<div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
					<p class="font-medium text-white">Hinweis</p>
					<p class="mt-2">
						Wenn das lokale Video schwarz bleibt, pruefe zuerst die Browser-Berechtigung fuer Kamera
						und Mikrofon.
					</p>
				</div>
			</section>

			<section class="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
				<h2 class="text-lg font-semibold">Deine Kamera</h2>
				<video
					bind:this={localVideo}
					autoplay
					muted
					playsinline
					class="aspect-video w-full rounded-2xl bg-black"
				></video>
				<p class="text-sm text-slate-400">
					{mediaStarted ? 'Lokale Vorschau sollte sichtbar sein.' : 'Noch nicht gestartet.'}
				</p>
			</section>

			<section class="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
				<h2 class="text-lg font-semibold">Anderer Teilnehmer</h2>
				<video
					bind:this={remoteVideo}
					autoplay
					playsinline
					class="aspect-video w-full rounded-2xl bg-black"
				></video>
				<p class="text-sm text-slate-400">
					Das entfernte Video erscheint, sobald ein zweiter Teilnehmer mit demselben Code beitritt.
				</p>
			</section>
		</div>
	</div>
</div>
