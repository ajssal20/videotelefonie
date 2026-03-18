<script>
	import { onMount } from 'svelte';
	import { getMediaDevices } from '$lib/rtc.js';

	let devices = $state({
		audioInputs: [],
		audioOutputs: [],
		videoInputs: []
	});
	let permissionState = $state('Nicht geprueft');
	let error = $state('');

	onMount(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
			permissionState = 'Erteilt';
			devices = await getMediaDevices();
			stream.getTracks().forEach((track) => track.stop());
		} catch (cause) {
			permissionState = 'Abgelehnt oder noch nicht verfuegbar';
			error = cause instanceof Error ? cause.message : 'Unbekannter Fehler';
		}
	});
</script>

<svelte:head>
	<title>Einstellungen</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 px-6 py-10 text-white">
	<div class="mx-auto max-w-4xl space-y-6">
		<div class="rounded-3xl border border-white/10 bg-white/5 p-6">
			<h1 class="text-3xl font-bold">Einstellungen</h1>
			<p class="mt-3 text-sm text-slate-300">
				Die Seite prueft Medienberechtigungen und listet erkennbare Audio- und Videogeraete auf.
			</p>
			<p class="mt-3 text-sm text-cyan-300">Berechtigungsstatus: {permissionState}</p>
			{#if error}
				<p class="mt-2 text-sm text-rose-300">{error}</p>
			{/if}
		</div>

		<div class="grid gap-6 md:grid-cols-3">
			<section class="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
				<h2 class="text-lg font-semibold">Kameras</h2>
				<ul class="mt-4 space-y-2 text-sm text-slate-300">
					{#each devices.videoInputs as device (device.deviceId)}
						<li>{device.label || device.deviceId}</li>
					{:else}
						<li>Keine Kamera erkannt</li>
					{/each}
				</ul>
			</section>

			<section class="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
				<h2 class="text-lg font-semibold">Mikrofone</h2>
				<ul class="mt-4 space-y-2 text-sm text-slate-300">
					{#each devices.audioInputs as device (device.deviceId)}
						<li>{device.label || device.deviceId}</li>
					{:else}
						<li>Kein Mikrofon erkannt</li>
					{/each}
				</ul>
			</section>

			<section class="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
				<h2 class="text-lg font-semibold">Audio-Ausgabe</h2>
				<ul class="mt-4 space-y-2 text-sm text-slate-300">
					{#each devices.audioOutputs as device (device.deviceId)}
						<li>{device.label || device.deviceId}</li>
					{:else}
						<li>Keine Ausgabe erkannt</li>
					{/each}
				</ul>
			</section>
		</div>
	</div>
</div>
