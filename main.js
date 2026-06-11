// Three.js is now loaded via script tag in index.html to support file:// protocol

const canvasEl = document.querySelector('#canvas');
const cleanBtn = document.querySelector('#cleanBtn');
const autoBtn = document.querySelector('#autoBtn');
const musicBtn = document.querySelector('#musicBtn');
const nameEl = document.querySelector('.name');
const headerEl = document.querySelector('.header');

/* ------------------------------------------------------------------
   🎵 Background music: "Lover" — Taylor Swift
   Plan A: play "lover.mp3" if it exists next to this page (bulletproof)
   Plan B: fall back to a YouTube mini-player
------------------------------------------------------------------- */
const YT_VIDEO_ID = '-BjZmE2gtdo'; // Taylor Swift – Lover (Official Music Video)
const SONG_START_AT = 120; // ⏩ start at 2:00
let isMusicPlaying = false;

// Plan A: local mp3
const bgAudio = new Audio('lover.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.7;

// when the song loops back, also skip the intro
bgAudio.addEventListener('timeupdate', () => {
	if (bgAudio.currentTime < SONG_START_AT - 0.5) {
		bgAudio.currentTime = SONG_START_AT;
	}
});

function setMusicBtn(playing) {
	musicBtn.classList.toggle('active', playing);
	musicBtn.querySelector('.btn-text').textContent = playing ? 'Stop "Lover"' : 'Play "Lover"';
	musicBtn.querySelector('.btn-icon').textContent = playing ? '💗' : '🎵';
}

function startYouTubeFallback() {
	const holder = document.getElementById('ytPlayer');
	holder.innerHTML = '<iframe width="100%" height="100%" ' +
		'src="https://www.youtube.com/embed/' + YT_VIDEO_ID +
		'?autoplay=1&start=' + SONG_START_AT + '&loop=1&playlist=' + YT_VIDEO_ID + '&controls=1&rel=0" ' +
		'frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
	holder.classList.add('yt-visible');
}

function stopAllMusic() {
	bgAudio.pause();
	bgAudio.currentTime = 0;
	const holder = document.getElementById('ytPlayer');
	holder.innerHTML = '';
	holder.classList.remove('yt-visible');
	isMusicPlaying = false;
	setMusicBtn(false);
}

musicBtn.addEventListener('click', () => {
	if (isMusicPlaying) {
		stopAllMusic();
		return;
	}

	// Try the local mp3 first (skip the intro)
	bgAudio.currentTime = SONG_START_AT;
	bgAudio.play().then(() => {
		// mp3 found & playing
		isMusicPlaying = true;
		setMusicBtn(true);
	}).catch(() => {
		// no mp3 file found — use YouTube mini-player instead
		startYouTubeFallback();
		isMusicPlaying = true;
		setMusicBtn(true);
	});
});

/* ------------------------------------------------------------------
   💕 Floating hearts — little hearts drift up when flowers are planted
------------------------------------------------------------------- */
function spawnHeart(xRatio, yRatio) {
	const heart = document.createElement('span');
	const hearts = ['💕', '💖', '🌸', '💗', '✨', '🩷'];
	heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
	heart.className = 'floating-heart';
	heart.style.left = (xRatio * 100) + '%';
	heart.style.top = (yRatio * 100) + '%';
	heart.style.fontSize = (0.9 + Math.random() * 1.1) + 'rem';
	heart.style.animationDuration = (2.5 + Math.random() * 2) + 's';
	document.body.appendChild(heart);
	setTimeout(() => heart.remove(), 4500);
}

// gentle ambient hearts floating up from the bottom
setInterval(() => {
	spawnHeart(Math.random(), 1.02);
}, 1800);

// State
let isDarkTheme = false;
let isClean = true;
let isAutoBloom = false;
let autoBloomInterval = null;

const pointer = {
	x: 0.66,
	y: 0.3,
	clicked: true,
	vanishCanvas: false
};

// Auto-click for demo preview
window.setTimeout(() => {
	pointer.x = 0.75;
	pointer.y = 0.5;
	pointer.clicked = true;
}, 700);

// Three.js Setup
let basicMaterial, shaderMaterial;
let renderer = new THREE.WebGLRenderer({
	canvas: canvasEl,
	alpha: true,
	antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

let sceneShader = new THREE.Scene();
let sceneBasic = new THREE.Scene();
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
let clock = new THREE.Clock();

let renderTargets = [
	new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
	new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
];

createPlane();
updateSize();

// Resize Handler
window.addEventListener('resize', () => {
	updateSize();
	cleanCanvas();
});

// Render Loop
render();

// Interaction Handler
function handleInteraction() {
	if (isClean) {
		nameEl.classList.add('fade-out');
		headerEl.classList.add('fade-out'); // Auto-hide header
		isClean = false;
	}
}

// Input Handling
let isTouchScreen = false;

window.addEventListener('click', e => {
	// Ignore clicks on buttons
	if (e.target.closest('button')) return;

	handleInteraction();

	if (!isTouchScreen) {
		pointer.x = e.pageX / window.innerWidth;
		pointer.y = e.pageY / window.innerHeight;
		pointer.clicked = true;
		spawnHeart(pointer.x, pointer.y); // 💕 heart pops where you plant
	}
});

window.addEventListener('touchstart', e => {
	// Ignore touches on buttons
	if (e.target.closest('button')) return;

	handleInteraction();

	isTouchScreen = true;
	pointer.x = e.targetTouches[0].pageX / window.innerWidth;
	pointer.y = e.targetTouches[0].pageY / window.innerHeight;
	pointer.clicked = true;
	spawnHeart(pointer.x, pointer.y); // 💕
}, { passive: false });

// Controls
cleanBtn.addEventListener('click', cleanCanvas);

// Auto Bloom Feature
autoBtn.addEventListener('click', () => {
	isAutoBloom = !isAutoBloom;
	autoBtn.classList.toggle('active');

	if (isAutoBloom) {
		// Start auto bloom logic
		startAutoBloom();
	} else {
		// Stop auto bloom logic
		stopAutoBloom();
	}
});

function startAutoBloom() {
	// Plant a flower immediately
	plantRandomFlower();
	handleInteraction(); // Also hide UI when auto bloom starts

	// Plant more at random intervals
	autoBloomInterval = setInterval(() => {
		plantRandomFlower();
	}, 400); // Fast bloom speed
}

function stopAutoBloom() {
	if (autoBloomInterval) {
		clearInterval(autoBloomInterval);
		autoBloomInterval = null;
	}
}

function plantRandomFlower() {
	pointer.x = Math.random();
	pointer.y = Math.random();
	pointer.clicked = true;
	spawnHeart(pointer.x, pointer.y); // 💕

	handleInteraction();
}

function cleanCanvas() {
	pointer.vanishCanvas = true;
	setTimeout(() => {
		pointer.vanishCanvas = false;
	}, 50);
}

function createPlane() {
	shaderMaterial = new THREE.ShaderMaterial({
		uniforms: {
			u_stop_time: { type: 'f', value: 0 },
			u_stop_randomizer: {
				type: 'v2',
				value: new THREE.Vector2(Math.random(), Math.random()),
			},
			u_cursor: { type: 'v2', value: new THREE.Vector2(pointer.x, pointer.y) },
			u_ratio: { type: 'f', value: window.innerWidth / window.innerHeight },
			u_texture: { type: 't', value: null },
			u_clean: { type: 'f', value: 1 },
			u_theme: { type: 'f', value: 0.0 }
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent,
		transparent: true
	});

	basicMaterial = new THREE.MeshBasicMaterial();
	const planeGeometry = new THREE.PlaneGeometry(2, 2);
	const planeBasic = new THREE.Mesh(planeGeometry, basicMaterial);
	const planeShader = new THREE.Mesh(planeGeometry, shaderMaterial);

	sceneBasic.add(planeBasic);
	sceneShader.add(planeShader);
}

function render() {
	shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1;
	shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;

	if (pointer.clicked) {
		shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(
			pointer.x,
			1 - pointer.y
		);
		shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(
			Math.random(),
			Math.random()
		);
		shaderMaterial.uniforms.u_stop_time.value = 0;
		pointer.clicked = false;
	}
	shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();

	renderer.setRenderTarget(renderTargets[1]);
	renderer.render(sceneShader, camera);
	basicMaterial.map = renderTargets[1].texture;
	renderer.setRenderTarget(null);
	renderer.render(sceneBasic, camera);

	let tmp = renderTargets[0];
	renderTargets[0] = renderTargets[1];
	renderTargets[1] = tmp;

	requestAnimationFrame(render);
}

function updateSize() {
	shaderMaterial.uniforms.u_ratio.value = window.innerWidth / window.innerHeight;
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Resize render targets to match
	renderTargets[0].setSize(window.innerWidth, window.innerHeight);
	renderTargets[1].setSize(window.innerWidth, window.innerHeight);
}