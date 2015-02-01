var THREE = require('three');
var CANNON = require('cannon');
var key = require('keymaster');
var boids = require('boids');
var _ = require('lodash');
var entities = require('./entities');

var shootSound, hitSound, music;
var world, player, bullets=[], objects=[], villagers=[], shield, timeStep=1/60;
var camera, scene, light, webglRenderer, container;
var groundMesh, playerMesh, playerMiniMesh, objectMeshs=[], villagerMeshs=[], objectMiniMeshs=[], shieldMesh, bulletMeshs=[];
var hunters=[], hunterMeshs=[], hunterMiniMeshs=[];
var villagerFlock, hunterFlock;

var bulletsToRemove = [], villagersToRemove = [];
var villagersHit = [];
var villagersToHunters = [];

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var CAMERA_START_X = 1000;
var CAMERA_START_Y = 1200;
var CAMERA_START_Z = 0;

var LEVEL = 500;

var HEALTH = 30;
var SHIELD = 60;
var SPEED = 10;
var DMG = 5;
var CREDITS = 100;

var NEW_HEALTH = HEALTH;
var NEW_SHIELD = SHIELD;
var NEW_SPEED = SPEED;
var NEW_DMG = DMG;
var NEW_CREDITS = CREDITS;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var toggleMapOn = true;
var toggleSoundOn = false;

//sounds
var sounds = [
	{src:"music.mp3", id:"music"},
	{src:"music2.mp3", id:"music2"},
	{src:"shoot.wav", id:"shoot"},
	{src:"hit.wav", id:"hit"}
];

initSound();
initCannon();
initThree();
initBoids();
initEvents();
animate();

function initSound () {
	createjs.Sound.registerSounds(sounds, "assets/");
	setTimeout(function(){
		//music = createjs.Sound.play("music2", {loop: -1});
		shootSound = createjs.Sound.createInstance("shoot");
		hitSound = createjs.Sound.createInstance("hit");
	}, 3000);
	document.getElementById('music').onclick = function () {
		if (toggleSoundOn && music) {
			music.resume();
			toggleSoundOn = false;
			document.getElementById("volume").className = "fa fa-volume-up";
		} else if (music) {
			music.pause();
			toggleSoundOn = true;
			document.getElementById("volume").className = "fa fa-volume-off";
		}
	};
}

function initCannon() {
	world = new CANNON.World();
	world.gravity.set(0,0,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	//player physics
	player = entities.playerPhysics(HEALTH);
	world.add(player);

	//shield physics
	shield = entities.shieldPhysics(SHIELD, HEALTH);
	world.add(shield);

	//object physics
	objects = entities.objectPhysics();
	for (var i = 0; i < objects.length; i++){
		world.add(objects[i]);
	}

	//villager physics
	villagers = entities.villagerPhysics();
	for (var i = 0; i < villagers.length; i++){
		world.add(villagers[i]);
	}

}

function initThree() {

	container = document.createElement('div');
	document.body.appendChild(container);

	//Add listener for mouse click to shoot bullet
	container.addEventListener('click', spawnBullet, false);

	//Toggle mini map.
	key('tab', function(){
		toggleMiniMap();
		return false;
	});

	//camera
	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 100000);
	camera.position.x = CAMERA_START_X;
	camera.position.y = CAMERA_START_Y;
	camera.position.z = CAMERA_START_Z;
	camera.lookAt({
		x: 0,
		y: 0,
		z: 0
	});

	scene = new THREE.Scene();

	//ground
	groundMesh = entities.groundMesh();
	scene.add(groundMesh);

	//playerMesh
	playerMesh = entities.playerMesh(HEALTH);
	scene.add(playerMesh);

	//playerMiniMesh
	playerMiniMesh = entities.playerMiniMesh(HEALTH);
	scene.add(playerMiniMesh);

	//shieldMesh
	shieldMesh = entities.shieldMesh(SHIELD, HEALTH);
	scene.add(shieldMesh);

	//objectMesh
	objectMeshs = entities.objectMesh(objects);
	for (var i = 0; i < objectMeshs.length; i++){
		scene.add(objectMeshs[i]);
	}

	//objectMiniMesh
	objectMiniMeshs = entities.objectMiniMesh(objects);
	for (var i = 0; i < objectMiniMeshs.length; i++){
		scene.add(objectMiniMeshs[i]);
	}

	//villagerMesh
	villagerMeshs = entities.villagerMesh(villagers);
	for (var i = 0; i < villagerMeshs.length; i++){
		scene.add(villagerMeshs[i]);
	}

	//villagerMiniMesh
	villagerMiniMeshs = entities.villagerMiniMesh(villagers);
	for (var i = 0; i < villagerMiniMeshs.length; i++){
		scene.add(villagerMiniMeshs[i]);
	}

	//lights
	light = new THREE.DirectionalLight(0xffffff, 1.75);
	light.position.set(1, 1, 1);
	light.castShadow = false;

	light.shadowMapWidth = SCREEN_WIDTH;
	light.shadowMapHeight = SCREEN_HEIGHT;

	var d = 1000;

	light.shadowCameraLeft = -d;
	light.shadowCameraRight = d;
	light.shadowCameraTop = d;
	light.shadowCameraBottom = -d;

	light.shadowCameraFar = 1000;
	light.shadowDarkness = 0.5;

	camera.add(light);
	scene.add(camera);

	//renderer
	webglRenderer = new THREE.WebGLRenderer();
	webglRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	webglRenderer.domElement.style.position = "relative";
	webglRenderer.shadowMapEnabled = true;
	webglRenderer.shadowMapSoft = true;

	container.appendChild(webglRenderer.domElement);
	window.addEventListener('resize', onWindowResize, false);
}

function initBoids() {
	villagerFlock = boids({
		boids: villagers.length, // The amount of boids to use
		speedLimit: 5,           // Max steps to take per tick
		accelerationLimit: 0.1,    // Max acceleration per tick
		separationDistance: 10,  // Radius at which boids avoid others
		alignmentDistance: 300,  // Radius at which boids align with others
		choesionDistance: 1000,   // Radius at which boids approach others
		separationForce: 0.1,   // Speed to avoid at
		alignmentForce: 0.1,    // Speed to align with other boids
		choesionForce: 0.1,     // Speed to move towards other boids
		attractors: [
			[-2000,-2000,2000,-10],
			[-2000,2000,2000,-10],
			[2000,-2000,2000,-10],
			[2000,2000,2000,-10]
		] //Edge of the map to contain villagers
	});
	for (var i = 0; i < villagers.length; i++) {
		villagerFlock.boids[i][0] = villagers[i].position.x;
		villagerFlock.boids[i][1] = villagers[i].position.z;
		villagerFlock.boids[i][2] = 0;
		villagerFlock.boids[i][3] = 0;
	}

	hunterFlock = boids({
		boids: 0, // The amount of boids to use
		speedLimit: 10,           // Max steps to take per tick
		accelerationLimit: 0.1,    // Max acceleration per tick
		separationDistance: 100,  // Radius at which boids avoid others
		alignmentDistance: 300,  // Radius at which boids align with others
		choesionDistance: 1000,   // Radius at which boids approach others
		separationForce: 0.1,   // Speed to avoid at
		alignmentForce: 0.1,    // Speed to align with other boids
		choesionForce: 0.1,     // Speed to move towards other boids
		attractors: [
			[0,0,1000,10], //player attractor
			[-4000,-4000,4000,-10],
			[-4000,4000,4000,-10],
			[4000,-4000,4000,-10],
			[4000,4000,4000,-10]
		] //Edge of the map to contain villagers
	});
}

function initEvents() {
	for (var i = 0; i < villagers.length; i++) {
		villagers[i].addEventListener("collide", villagerGotHit);
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	webglRenderer.setSize(window.innerWidth, window.innerHeight);
}

function spawnBullet(e) {

	e.preventDefault();

	if(shootSound) {
		shootSound.play();
	}

	var r = Math.atan2(e.clientY - (window.innerHeight / 2), e.clientX - (window.innerWidth / 2));

	var velx =  Math.sin(r) * 2000;
	var velz = -1 * (Math.cos(r) * 2000);

	var data = {
		velx: velx,
		velz: velz,
		x: player.position.x,
		z: player.position.z,
		m: NEW_DMG,
		name: bullets.length
	};

	//bullet physics
	bullet = entities.bulletPhysics(data);
	world.add(bullet);
	bullets.push(bullet);

	//bullet mesh
	bulletMesh = entities.bulletMesh(data);
	scene.add(bulletMesh);
	bulletMeshs.push(bulletMesh);

	bullet.addEventListener("collide",function(e){
		if (e.body.collisionFilterGroup === 16) {
			if (bulletsToRemove.indexOf(bulletMesh.name) === -1) {
				bulletsToRemove.push(bulletMesh.name);
			}
		}
	});

}

function toggleMiniMap() {
	if (toggleMapOn) {
		playerMiniMesh.material.opacity = 0;
		for (var i = 0; i < objectMiniMeshs.length; i++) {
			objectMiniMeshs[i].material.opacity = 0;
		}
		for (var i = 0; i < villagerMiniMeshs.length; i++) {
			villagerMiniMeshs[i].material.opacity = 0;
		}
		for (var i = 0; i < hunterMiniMeshs.length; i++) {
			hunterMiniMeshs[i].material.opacity = 0;
		}
		toggleMapOn = false;
	} else {
		playerMiniMesh.material.opacity = 0.9;
		for (var i = 0; i < objectMiniMeshs.length; i++) {
			objectMiniMeshs[i].material.opacity = 0.3;
		}
		for (var i = 0; i < villagerMiniMeshs.length; i++) {
			villagerMiniMeshs[i].material.opacity = 0.9;
		}
		for (var i = 0; i < hunterMiniMeshs.length; i++) {
			hunterMiniMeshs[i].material.opacity = 0.9;
		}
		toggleMapOn = true;
	}
}

function updatePlayerHealth() {
	if (NEW_CREDITS - 2 >= 0) {
		NEW_CREDITS = NEW_CREDITS - 2;
		NEW_HEALTH = NEW_HEALTH + 1;
		var h = NEW_HEALTH + 20;
		var s = NEW_SHIELD + NEW_HEALTH;
		var m = NEW_HEALTH / 16;
		player.shapes[0] = new CANNON.Box(new CANNON.Vec3(NEW_HEALTH, NEW_HEALTH, NEW_HEALTH));
		player.mass = NEW_HEALTH;
		player.updateMassProperties();
		shield.shapes[0] = new CANNON.Box(new CANNON.Vec3(s, s, s));
		playerMesh.geometry = new THREE.BoxGeometry(h, h, h);
		playerMiniMesh.geometry = new THREE.BoxGeometry(m, m, m);
		shieldMesh.geometry = new THREE.BoxGeometry(s, s, s);
	}
}

function animate() {

	//keep stats up-to-date
	document.getElementById("health").innerHTML = NEW_HEALTH;
	document.getElementById("shield").innerHTML = NEW_SHIELD;
	document.getElementById("speed").innerHTML = NEW_SPEED;
	document.getElementById("dmg").innerHTML = NEW_DMG;
	document.getElementById("credits").innerHTML = NEW_CREDITS;

	//Keep player and villagers level
	player.position.y = LEVEL;
	for (var i = 0; i < villagers.length; i++) {
		villagers[i].position.y = LEVEL;
	}
	for (var i = 0; i < hunters.length; i++) {
		hunters[i].position.y = LEVEL;
	}
	for (var i = 0; i < objects.length; i++) {
		objects[i].position.y = LEVEL;
	}

	//player input
	if(key.isPressed("W")) {
		player.position.x -= SPEED;
	}
	if(key.isPressed("S")) {
		player.position.x += SPEED;
	}
	if(key.isPressed("A")) {
		player.position.z += SPEED;
	}
	if(key.isPressed("D")) {
		player.position.z -= SPEED;
	}
	if(key.isPressed("1")) {
		updatePlayerHealth();
	}

	requestAnimationFrame(animate);
	updateAI();
	updatePhysics();
	handleHits();
	removeEntities();
	spawnEntities();

	//camera should match playerMesh position
	camera.position.x = CAMERA_START_X + playerMesh.position.x;
	camera.position.z = CAMERA_START_Z + playerMesh.position.z;
	camera.position.y = CAMERA_START_Y + playerMesh.position.y;

	render();
}

function updatePhysics() {

	// Step the physics world
	world.step(timeStep);

	// Copy coordinates from Cannon.js to Three.js
	playerMesh.position.copy(player.position);
	playerMesh.quaternion.copy(player.quaternion);
	playerMiniMesh.position.x = playerMesh.position.x + (playerMesh.position.x / 16);
	playerMiniMesh.position.z = playerMesh.position.z  + (playerMesh.position.z / 16);

	for (var i = 0; i < objectMeshs.length; i++) {
		objectMeshs[i].position.copy(objects[i].position);
		objectMeshs[i].quaternion.copy(objects[i].quaternion);
		objectMiniMeshs[i].position.x = playerMesh.position.x + (objectMeshs[i].position.x / 16);
		objectMiniMeshs[i].position.z = playerMesh.position.z  + (objectMeshs[i].position.z / 16);
	}

	for (var i = 0; i < bulletMeshs.length; i++) {
		bulletMeshs[i].position.copy(bullets[i].position);
		bulletMeshs[i].quaternion.copy(bullets[i].quaternion);
	}

	for (var i = 0; i < villagerMeshs.length; i++) {
		villagerMeshs[i].position.copy(villagers[i].position);
		villagerMeshs[i].quaternion.copy(villagers[i].quaternion);
		villagerMiniMeshs[i].position.x = playerMesh.position.x + (villagerMeshs[i].position.x / 16);
		villagerMiniMeshs[i].position.z = playerMesh.position.z  + (villagerMeshs[i].position.z / 16);
	}

	for (var i = 0; i < hunterMeshs.length; i++) {
		hunterMeshs[i].position.copy(hunters[i].position);
		hunterMeshs[i].quaternion.copy(hunters[i].quaternion);
		hunterMiniMeshs[i].position.x = playerMesh.position.x + (hunterMeshs[i].position.x / 16);
		hunterMiniMeshs[i].position.z = playerMesh.position.z  + (hunterMeshs[i].position.z / 16);
	}

	shieldMesh.position.copy(player.position);
	shieldMesh.quaternion.copy(player.quaternion);
}

function updateAI() {
	villagerFlock.tick();
	hunterFlock.tick();
	for (var i = 0; i < villagers.length; i++) {
		villagers[i].position.x = villagerFlock.boids[i][0];
		villagers[i].position.z = villagerFlock.boids[i][1];
	}
	for (var i = 0; i < hunters.length; i++) {
		hunters[i].position.x = hunterFlock.boids[i][0];
		hunters[i].position.z = hunterFlock.boids[i][1];
	}
	hunterFlock.attractors[0][0] = player.position.x;
	hunterFlock.attractors[0][1] = player.position.z;
}

function villagerGotHit(e) {
	var v = Math.max(Math.abs(e.body.velocity.x), Math.abs(e.body.velocity.z));
	if (e.body.collisionFilterGroup === 8 && v > 1) {
		if(hitSound) {
			hitSound.play();
		}
		var villagerIds = _.pluck(villagersHit, 'id');
		if (villagerIds.indexOf(e.contact.bi.id) === -1) {
			villagersHit.push({
				id: e.contact.bi.id,
				dmg: e.body.mass
			});
		}
	}
}

function removeEntities() {
	if (bulletsToRemove) {
		for (var i = 0; i < bulletsToRemove.length; i++) {
			if (bullets[bulletsToRemove[i]]) {
				world.remove(bullets[bulletsToRemove[i]]);
				bullets.splice(bulletsToRemove[i], 1);
				scene.remove(bulletMeshs[bulletsToRemove[i]]);
				bulletMeshs.splice(bulletsToRemove[i], 1);
			}
		}
	}
	if (villagersToRemove) {
		for (var i = 0; i < villagersToRemove.length; i++) {
			if (villagers[villagersToRemove[i]]) {
				world.remove(villagers[villagersToRemove[i]]);
				villagers.splice(villagersToRemove[i], 1);
				scene.remove(villagerMeshs[villagersToRemove[i]]);
				villagerMeshs.splice(villagersToRemove[i], 1);
				scene.remove(villagerMiniMeshs[villagersToRemove[i]]);
				villagerMiniMeshs.splice(villagersToRemove[i], 1);

				villagerFlock.boids.splice(villagersToRemove[i], 1);
			}
		}
	}
	bulletsToRemove = [];
	villagersToRemove = [];
}

function spawnEntities() {
	if (villagersToHunters) {
		for (var i = 0; i < villagersToHunters.length; i++) {

			var data = {
				m: villagersToHunters[i].mass,
				x: villagersToHunters[i].position.x,
				z: villagersToHunters[i].position.z,
				aX: villagersToHunters[i].angularVelocity.x,
				aY: villagersToHunters[i].angularVelocity.y,
				aZ: villagersToHunters[i].angularVelocity.z,
				name: hunters.length
			};

			var hunter = entities.hunterPhysics(data);
			world.add(hunter);
			hunters.push(hunter);

			var hunterMesh = entities.hunterMesh(data);
			scene.add(hunterMesh);
			hunterMeshs.push(hunterMesh);

			var hunterMiniMesh = entities.hunterMiniMesh(data);
			scene.add(hunterMiniMesh);
			hunterMiniMeshs.push(hunterMiniMesh);

			hunterFlock.boids.push([hunter.position.x, hunter.position.z, hunter.velocity.x, hunter.velocity.z, 0, 0]);
			console.log(hunterFlock);
		}
	}
	villagersToHunters = [];
}

function handleHits() {
	if (villagersHit) {
		for (var i = 0; i < villagers.length; i++) {
			for (var v = 0; v < villagersHit.length; v++) {
				if (villagers[i].id === villagersHit[v].id) {
					if (villagers[i].mass - villagersHit[v].dmg > 10) {

						//Give player credits
						NEW_CREDITS = NEW_CREDITS + villagersHit[v].dmg;

						var m = villagers[i].mass - villagersHit[v].dmg;
						var h = m + 20;
						var mini = h /16;
						villagers[i].shapes[0] = new CANNON.Box(new CANNON.Vec3(m, m, m));
						villagers[i].mass = m;
						villagers[i].updateMassProperties();
						villagerMeshs[i].geometry = new THREE.BoxGeometry(h, h, h);
						villagerMiniMeshs[i].geometry = new THREE.BoxGeometry(mini, mini, mini);

						//change villager to hunter
						if (villagersToHunters.indexOf(i) === -1) {
							villagersToHunters.push(villagers[i]);
						}

						//remvoe the villager
						if (villagersToRemove.indexOf(i) === -1) {
							villagersToRemove.push(i);
						}

					} else {

						//Give player credits
						NEW_CREDITS = NEW_CREDITS + villagers[i].mass;

						//remove the villager
						if (villagersToRemove.indexOf(i) === -1) {
							villagersToRemove.push(i);
						}
					}
				}
			}
		}
	}
	villagersHit = [];
}

function render() {
	camera.lookAt(playerMesh.position);
	webglRenderer.render(scene, camera);
}
