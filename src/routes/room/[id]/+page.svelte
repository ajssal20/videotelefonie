<script>
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { createPeerSession } from '$lib/rtc.js';

	let { data } = $props();

	let localVideo;
	let remoteVideo;
	let socket;
	let session;
	let status = $state('Verbinde...');
	let error = $state('');

	const roomId = $derived(data.roomId);
	const signalUrl = 'ws://localhost:8080';

	onMount(() => {
		let cancelled = false;

		async function setupRoom() {
			try {
				socket = new WebSocket(signalUrl);

				socket.addEventListener('open', async () => {
					if (cancelled) return;

					session = createPeerSession({
						roomId,
						socket,
						localVideo,
						remoteVideo,
						onConnectionStateChange: (nextState) => {
							status = `Verbindungsstatus: ${nextState}`;
						}
					});

					await session.startLocalMedia({
						video: true,
						audio: true
					});

					socket.send(JSON.stringify({ type: 'join', roomId }));
					status = 'Warte auf zweiten Teilnehmer...';
				});

				socket.addEventListener('message', async ({ data: rawData }) => {
					const message = JSON.parse(rawData);

					if (message.type === 'peer-ready') {
						status = 'Zweiter Teilnehmer beigetreten. Angebot wird erstellt...';
						await session.createOffer();
						return;
					}

					await session.handleSignalMessage(message);
				});

				socket.addEventListener('close', () => {
					if (!cancelled) {
						status = 'Signaling getrennt';
					}
				});
			} catch (cause) {
				error = cause instanceof Error ? cause.message : 'Unbekannter Fehler';
				status = 'Fehler';
			}
		}

		void setupRoom();

		return () => {
			cancelled = true;
			socket?.close();
			session?.destroy();
		};
	});
</script>

<svelte:head>
	<title>Raum {roomId}</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 px-6 py-10 text-white">
	<div class="mx-auto max-w-6xl space-y-6">
		<div
			class="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 lg:flex-row lg:items-end lg:justify-between"
		>
			<div>
				<p class="text-sm tracking-[0.3em] text-cyan-300 uppercase">Raum</p>
				<h1 class="mt-2 text-3xl font-bold">{roomId}</h1>
				<p class="mt-2 text-sm text-slate-300">{status}</p>
				{#if error}
					<p class="mt-2 text-sm text-rose-300">{error}</p>
				{/if}
			</div>

			<div class="flex gap-3 text-sm">
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

		<div class="grid gap-6 lg:grid-cols-2">
			<section class="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
				<h2 class="text-lg font-semibold">Lokales Video</h2>
				<video
					bind:this={localVideo}
					autoplay
					muted
					playsinline
					class="aspect-video w-full rounded-2xl bg-black"
				></video>
			</section>

			<section class="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
				<h2 class="text-lg font-semibold">Entfernter Teilnehmer</h2>
				<video
					bind:this={remoteVideo}
					autoplay
					playsinline
					class="aspect-video w-full rounded-2xl bg-black"
				></video>
			</section>
		</div>
	</div>
</div>
