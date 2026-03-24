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

<div class="landing-shell">
	<div class="glow glow-left"></div>
	<div class="glow glow-right"></div>
	<div class="texture"></div>

	<section class="landing-content">
		<div class="hero reveal reveal-1">
			<div class="hero-copy">
				<p class="eyebrow">Live Classroom</p>
				<h1>Stark. Auffaellig. Sofort bereit fuer den Videocall.</h1>
				<p class="hero-text">
					Eine auffaellige Startseite mit starken Farben, klaren Aktionen und einem direkten Flow:
					Raum erstellen, Code teilen, beitreten und loslegen.
				</p>
			</div>

			<div class="hero-badge">
				<span>6-stelliger Code</span>
				<strong>Schneller Einstieg fuer Unterricht und Team-Calls</strong>
			</div>
		</div>

		<div class="landing-grid">
			<section class="panel panel-primary reveal reveal-2">
				<p class="panel-label">Erstellen</p>
				<h2>Neuen Klassenraum starten</h2>
				<p>
					Erzeuge direkt einen frischen Code und springe ohne Umwege in den Raum.
				</p>

				<button type="button" class="cta-button" onclick={openNewClassroom}>
					Neuen Klassen-Code erstellen
				</button>
			</section>

			<section class="panel panel-secondary reveal reveal-3">
				<p class="panel-label">Beitreten</p>
				<h2>Mit bestehendem Code rein</h2>
				<p>Teilnehmer geben den Raumcode ein und landen sofort im richtigen Videoraum.</p>

				<form class="join-form" onsubmit={joinClassroom}>
					<input bind:value={joinCode} placeholder="z.B. 8K4M2P" />
					<button type="submit">Beitreten</button>
				</form>
			</section>

			<aside class="panel panel-accent reveal reveal-4">
				<p class="panel-label">Ablauf</p>
				<h2>Drei Schritte, kein Ballast</h2>
				<ul>
					{#each steps as step (step)}
						<li>{step}</li>
					{/each}
				</ul>

				<a href={resolve('/settings')} class="settings-link">
					Geraete und Berechtigungen pruefen
				</a>
			</aside>
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
		background:
			radial-gradient(circle at 15% 20%, rgba(255, 91, 143, 0.22), transparent 24%),
			radial-gradient(circle at 85% 18%, rgba(255, 196, 76, 0.2), transparent 20%),
			radial-gradient(circle at 50% 100%, rgba(178, 255, 89, 0.12), transparent 26%),
			linear-gradient(145deg, #140912 0%, #2a0c18 38%, #120708 100%);
		color: #fff7f4;
	}

	.landing-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		padding: 38px 18px 54px;
	}

	.landing-content {
		position: relative;
		z-index: 2;
		margin: 0 auto;
		max-width: 1280px;
	}

	.glow,
	.texture {
		pointer-events: none;
		position: absolute;
	}

	.glow {
		border-radius: 999px;
		filter: blur(34px);
		animation: floaty 14s ease-in-out infinite;
	}

	.glow-left {
		top: -120px;
		left: -80px;
		height: 360px;
		width: 360px;
		background: radial-gradient(circle, rgba(255, 102, 153, 0.72) 0%, transparent 70%);
	}

	.glow-right {
		right: -110px;
		top: 24%;
		height: 320px;
		width: 320px;
		background: radial-gradient(circle, rgba(255, 188, 72, 0.62) 0%, transparent 70%);
		animation-direction: reverse;
	}

	.texture {
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
		background-size: 84px 84px;
		mask-image: radial-gradient(circle at center, black 36%, transparent 88%);
		opacity: 0.3;
	}

	.hero,
	.panel {
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: linear-gradient(180deg, rgba(53, 17, 28, 0.78), rgba(19, 7, 10, 0.88));
		backdrop-filter: blur(18px);
		box-shadow:
			0 28px 80px rgba(12, 3, 6, 0.44),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.hero {
		display: grid;
		gap: 24px;
		border-radius: 34px;
		padding: 34px;
	}

	.eyebrow,
	.panel-label {
		margin: 0 0 12px;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.34em;
		text-transform: uppercase;
		color: #ff9b6a;
	}

	h1,
	h2,
	p,
	strong {
		margin: 0;
	}

	h1 {
		max-width: 10ch;
		font-size: clamp(3rem, 8vw, 6.4rem);
		line-height: 0.94;
		letter-spacing: -0.05em;
	}

	.hero-text,
	.panel p,
	li {
		color: rgba(255, 238, 232, 0.78);
		line-height: 1.7;
	}

	.hero-badge {
		align-self: end;
		justify-self: start;
		display: grid;
		gap: 10px;
		border-radius: 26px;
		padding: 20px;
		background: linear-gradient(135deg, rgba(255, 153, 102, 0.18), rgba(213, 255, 85, 0.12));
		border: 1px solid rgba(255, 181, 92, 0.22);
	}

	.hero-badge span {
		font-size: 0.82rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #ffd47b;
	}

	.hero-badge strong {
		max-width: 22ch;
		font-size: 1.08rem;
		line-height: 1.45;
	}

	.landing-grid {
		display: grid;
		gap: 20px;
		margin-top: 22px;
	}

	.panel {
		border-radius: 30px;
		padding: 24px;
	}

	.panel-primary {
		background:
			radial-gradient(circle at top right, rgba(255, 204, 92, 0.22), transparent 30%),
			linear-gradient(180deg, rgba(76, 23, 27, 0.82), rgba(31, 9, 12, 0.92));
	}

	.panel-secondary {
		background:
			radial-gradient(circle at top left, rgba(255, 105, 160, 0.18), transparent 28%),
			linear-gradient(180deg, rgba(58, 15, 28, 0.82), rgba(27, 7, 14, 0.92));
	}

	.panel-accent {
		background:
			radial-gradient(circle at top, rgba(196, 255, 78, 0.18), transparent 26%),
			linear-gradient(180deg, rgba(48, 24, 10, 0.82), rgba(21, 12, 6, 0.92));
	}

	h2 {
		font-size: 1.9rem;
		line-height: 1.08;
		margin-bottom: 12px;
	}

	.cta-button,
	.join-form button,
	.settings-link {
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.cta-button,
	.join-form button {
		margin-top: 22px;
		border: 0;
		border-radius: 999px;
		padding: 15px 22px;
		font-weight: 800;
		cursor: pointer;
	}

	.cta-button {
		background: linear-gradient(120deg, #ff8a5b 0%, #ff4fa3 52%, #ffe26a 100%);
		color: #26070f;
		box-shadow: 0 18px 34px rgba(255, 112, 112, 0.26);
	}

	.join-form {
		display: grid;
		gap: 14px;
		margin-top: 22px;
	}

	.join-form input {
		min-width: 0;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 22px;
		background: rgba(20, 8, 10, 0.8);
		padding: 16px 18px;
		color: #fff7f0;
		font-size: 1rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		outline: none;
	}

	.join-form input::placeholder {
		letter-spacing: normal;
		text-transform: none;
		color: rgba(255, 233, 225, 0.34);
	}

	.join-form button {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 178, 109, 0.22);
		color: #ffe0a6;
	}

	ul {
		padding: 0;
		margin: 20px 0 0;
		list-style: none;
		display: grid;
		gap: 12px;
	}

	li {
		border-radius: 20px;
		padding: 14px 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.settings-link {
		display: inline-flex;
		margin-top: 22px;
		color: #d7ff8e;
		font-weight: 700;
		text-decoration: none;
	}

	.cta-button:hover,
	.join-form button:hover,
	.settings-link:hover {
		transform: translateY(-2px);
	}

	.reveal {
		opacity: 0;
		transform: translateY(24px) scale(0.985);
		animation: reveal 720ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
	}

	.reveal-2 {
		animation-delay: 110ms;
	}

	.reveal-3 {
		animation-delay: 220ms;
	}

	.reveal-4 {
		animation-delay: 330ms;
	}

	@media (min-width: 860px) {
		.hero {
			grid-template-columns: 1.25fr 0.8fr;
			align-items: end;
		}

		.landing-grid {
			grid-template-columns: 1fr 1fr 0.9fr;
		}
	}

	@keyframes reveal {
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes floaty {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		50% {
			transform: translate3d(14px, -18px, 0) scale(1.08);
		}
	}
</style>
