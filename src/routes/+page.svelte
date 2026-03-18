<script>
	import { resolve } from '$app/paths';

	const features = [
		'Raum per Link teilen',
		'Kamera und Mikrofon vorab pruefen',
		'PWA-Basis fuer spaetere Offline- und Installierbarkeit'
	];

	let roomId = $state('');

	const normalizedRoomId = () =>
		roomId
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '') || crypto.randomUUID().slice(0, 8);
</script>

<svelte:head>
	<title>Videocall</title>
	<meta
		name="description"
		content="SvelteKit-Prototyp fuer WebRTC-Videoraeume mit separatem Signaling-Server."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<section class="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16">
		<div class="max-w-3xl space-y-6">
			<p class="text-sm font-semibold tracking-[0.3em] text-cyan-300 uppercase">SvelteKit WebRTC</p>
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
				Videoraeume mit einer klaren Basis fuer Signaling, Mediengeraete und PWA.
			</h1>
			<p class="max-w-2xl text-lg leading-8 text-slate-300">
				Dieses Grundgeruest trennt Browser-RTC, Raum-UI und den Node-basierten WebSocket-Server,
				damit du den Prototyp sauber erweitern kannst.
			</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
				<h2 class="text-xl font-semibold text-white">Raum starten</h2>
				<p class="mt-2 text-sm text-slate-300">
					Gib eine Raum-ID ein oder lass automatisch eine erstellen.
				</p>

				<form class="mt-6 flex flex-col gap-4 sm:flex-row" action={`/room/${normalizedRoomId()}`}>
					<input
						bind:value={roomId}
						name="room"
						placeholder="z.B. klasse-10b"
						class="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white ring-0 outline-none placeholder:text-slate-500"
					/>
					<button
						type="submit"
						class="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
					>
						Raum oeffnen
					</button>
				</form>

				<div class="mt-4">
					<a
						href={resolve('/settings')}
						class="text-sm font-medium text-cyan-300 underline decoration-white/20 underline-offset-4"
					>
						Geraete und Berechtigungen pruefen
					</a>
				</div>
			</div>

			<div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
				<h2 class="text-xl font-semibold text-white">Enthaltene Basis</h2>
				<ul class="mt-4 space-y-3 text-sm text-slate-200">
					{#each features as feature (feature)}
						<li class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">{feature}</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>
</div>
