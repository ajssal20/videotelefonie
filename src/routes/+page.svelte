<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const steps = [
		'Lehrkraft erstellt einen Klassen-Code',
		'Schueler geben den Code ein und treten dem Raum bei',
		'Im Raum Kamera und Mikrofon gezielt starten'
	];

	let joinCode = $state('');

	const normalizeCode = (value) =>
		value
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');

	const createClassCode = () => {
		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		return Array.from(
			{ length: 6 },
			() => alphabet[Math.floor(Math.random() * alphabet.length)]
		).join('');
	};

	const openNewClassroom = async () => {
		const code = createClassCode().toLowerCase();
		await goto(resolve(`/room/${code}`));
	};

	const joinClassroom = async (event) => {
		event.preventDefault();
		const code = normalizeCode(joinCode);
		if (!code) return;
		await goto(resolve(`/room/${code}`));
	};
</script>

<svelte:head>
	<title>Videocall</title>
	<meta
		name="description"
		content="Klassen-Code erstellen oder beitreten und anschliessend Kamera und Mikrofon im Raum starten."
	/>
</svelte:head>

<div class="min-h-screen bg-[radial-gradient(circle_at_top,_#12314d,_#020617_55%)] text-slate-100">
	<section class="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16">
		<div class="max-w-3xl space-y-6">
			<p class="text-sm font-semibold tracking-[0.3em] text-cyan-300 uppercase">
				Klassen-Videocall
			</p>
			<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
				Eine Klasse erstellt den Code. Die anderen treten mit dem Code bei.
			</h1>
			<p class="max-w-2xl text-lg leading-8 text-slate-300">
				Die Startseite ist jetzt auf einen einfachen Unterrichts-Flow reduziert: Klasse anlegen,
				Code teilen und erst im Raum Kamera und Mikrofon aktivieren.
			</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="grid gap-6">
				<div class="rounded-3xl border border-cyan-400/20 bg-white/8 p-6 backdrop-blur">
					<h2 class="text-xl font-semibold text-white">Klasse erstellen</h2>
					<p class="mt-2 text-sm text-slate-300">
						Erzeuge einen neuen Klassen-Code und oeffne direkt den Videoraum.
					</p>

					<button
						type="button"
						onclick={openNewClassroom}
						class="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
					>
						Neuen Klassen-Code erstellen
					</button>
				</div>

				<div class="rounded-3xl border border-white/10 bg-slate-900/65 p-6">
					<h2 class="text-xl font-semibold text-white">Mit Code beitreten</h2>
					<p class="mt-2 text-sm text-slate-300">
						Schueler oder weitere Teilnehmer geben hier den Klassen-Code ein.
					</p>

					<form class="mt-6 flex flex-col gap-4 sm:flex-row" onsubmit={joinClassroom}>
						<input
							bind:value={joinCode}
							placeholder="z.B. 8K4M2P"
							class="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 tracking-[0.25em] text-white uppercase ring-0 outline-none placeholder:tracking-normal placeholder:text-slate-500"
						/>
						<button
							type="submit"
							class="rounded-2xl border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
						>
							Beitreten
						</button>
					</form>
				</div>
			</div>

			<div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
				<h2 class="text-xl font-semibold text-white">Ablauf</h2>
				<ul class="mt-4 space-y-3 text-sm text-slate-200">
					{#each steps as step (step)}
						<li class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">{step}</li>
					{/each}
				</ul>

				<a
					href={resolve('/settings')}
					class="mt-6 inline-flex text-sm font-medium text-cyan-200 underline decoration-white/20 underline-offset-4"
				>
					Geraete und Berechtigungen pruefen
				</a>
			</div>
		</div>
	</section>
</div>
