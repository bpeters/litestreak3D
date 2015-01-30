var THREE = require('three');
var CANNON = require('cannon');
var key = require('keymaster');
var entities = require('./entities');

var world, player, bullets=[], objects=[], shield, timeStep=1/60;
var camera, scene, light, webglRenderer, container;
var groundMesh, playerMesh, playerMiniMesh, objectMeshs=[], objectMiniMeshs=[], shieldMesh, bulletMeshs=[];

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var CAMERA_START_X = 1000;
var CAMERA_START_Y = 1200;
var CAMERA_START_Z = 0;

var LEVEL = 500;

var HEALTH = 30;
var SHIELD = 60;
var SPEED = 10;
var CREDITS = 100;

var NEW_HEALTH = HEALTH;
var NEW_SHIELD = SHIELD;
var NEW_SPEED = SPEED;
var NEW_CREDITS = CREDITS;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var toggleOn = true;

initHTML();
initCannon();
initThree();
animate();

function initHTML() {
	document.getElementById("health").innerHTML = NEW_HEALTH;
	document.getElementById("shield").innerHTML = NEW_SHIELD;
	document.getElementById("speed").innerHTML = NEW_SPEED;
	document.getElementById("credits").innerHTML = NEW_CREDITS;
}

function initCannon() {
	world = new CANNON.World();
	world.gravity.set(0,0,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	//player physics
	entities.playerPhysics(HEALTH, function(physics) {
		player = physics;
	});
	world.add(player);

	//shield physics
	entities.shieldPhysics(SHIELD, HEALTH, function(physics) {
		shield = physics;
	});
	world.add(shield);

	//object physics
	entities.objectPhysics(function(physics) {
		objects = physics;
	});
	for (var i = 0; i < objects.length; i++){
		world.add(objects[i]);
	}
}

function initThree() {

	container = document.createElement('div');
	document.body.appendChild(container);

	//Add listener for mouse click to shoot bullet
	container.addEventListener('click', spawnBullet, false);
	container.addEventListener('dblclick', spawnBullet, false);

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
	entities.groundMesh(function(mesh) {
		groundMesh = mesh;
	});
	scene.add(groundMesh);

	//playerMesh
	entities.playerMesh(HEALTH, function(mesh) {
		playerMesh = mesh;
	});
	scene.add(playerMesh);

	//playerMiniMesh
	entities.playerMiniMesh(function(mesh) {
		playerMiniMesh = mesh;
	});
	scene.add(playerMiniMesh);

	//shieldMesh
	entities.shieldMesh(SHIELD, HEALTH, function(mesh) {
		shieldMesh = mesh;
	});
	scene.add(shieldMesh);

	//objectMesh
	entities.objectMesh(objects, function(mesh) {
		objectMeshs = mesh;
	});
	for (var i = 0; i < objectMeshs.length; i++){
		scene.add(objectMeshs[i]);
	}

	//objectMiniMesh
	entities.objectMiniMesh(objects, function(mesh) {
		objectMiniMeshs = mesh;
	});
	for (var i = 0; i < objectMiniMeshs.length; i++){
		scene.add(objectMiniMeshs[i]);
	}

	//lights
	light = new THREE.DirectionalLight(0xffffff, 1.75);
	light.position.set(1, 1, 1);
	light.castShadow = true;

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

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	webglRenderer.setSize(window.innerWidth, window.innerHeight);
}

function spawnBullet(e) {

	e.preventDefault();

	var r = Math.atan2(e.clientY - (window.innerHeight / 2), e.clientX - (window.innerWidth / 2));

	var velx =  Math.sin(r) * 2000;
	var velz = -1 * (Math.cos(r) * 2000);

	var data = {
		velx: velx,
		velz: velz,
		x: player.position.x,
		z: player.position.z,
	};

	//bullet physics
	entities.bulletPhysics(data, function(physics) {
		bullet = physics;
	});
	world.add(bullet);
	bullets.push(bullet);

	//bullet mesh
	entities.bulletMesh(function(mesh) {
		bulletMesh = mesh;
	});
	scene.add(bulletMesh);
	bulletMeshs.push(bulletMesh);

}

function toggleMiniMap() {
	if (toggleOn) {
		playerMiniMesh.material.opacity = 0;
		for (var i = 0; i < objectMiniMeshs.length; i++) {
			objectMiniMeshs[i].material.opacity = 0;
		}
		toggleOn = false;
	} else {
		playerMiniMesh.material.opacity = 0.9;
		for (var i = 0; i < objectMiniMeshs.length; i++) {
			objectMiniMeshs[i].material.opacity = 0.3;
		}
		toggleOn = true;
	}
}

function updatePlayerHealth() {
	NEW_CREDITS = NEW_CREDITS - 1;
	NEW_HEALTH = NEW_HEALTH + 1;
	var h = NEW_HEALTH + 20;
	var s = NEW_SHIELD + NEW_HEALTH;
	player.shapes[0] = new CANNON.Box(new CANNON.Vec3(NEW_HEALTH, NEW_HEALTH, NEW_HEALTH));
	player.mass = NEW_HEALTH;
	player.updateMassProperties();
	shield.shapes[0] = new CANNON.Box(new CANNON.Vec3(s, s, s));
	playerMesh.geometry = new THREE.BoxGeometry(h, h, h);
	shieldMesh.geometry = new THREE.BoxGeometry(s, s, s);
	document.getElementById("health").innerHTML = NEW_HEALTH;
	document.getElementById("credits").innerHTML = NEW_CREDITS;
}

function animate() {

	player.position.y = LEVEL;

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
	if(key.isPressed("1") && NEW_CREDITS >= 1) {
		updatePlayerHealth();
	}

	requestAnimationFrame(animate);
	updatePhysics();

	//playerMiniMesh should match playerMesh position
	playerMiniMesh.position.x = playerMesh.position.x + (playerMesh.position.x / 16);
	playerMiniMesh.position.z = playerMesh.position.z  + (playerMesh.position.z / 16);

	//objectMiniMesh should match objectMesh position
	for (var i = 0; i < objectMiniMeshs.length; i++) {
		objectMiniMeshs[i].position.x = playerMesh.position.x + (objectMeshs[i].position.x / 16);
		objectMiniMeshs[i].position.z = playerMesh.position.z  + (objectMeshs[i].position.z / 16);
	}

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

	for (var i = 0; i < objectMeshs.length; i++) {
		objectMeshs[i].position.copy(objects[i].position);
		objectMeshs[i].quaternion.copy(objects[i].quaternion);
	}

	for (var i = 0; i < bulletMeshs.length; i++) {
		bulletMeshs[i].position.copy(bullets[i].position);
		bulletMeshs[i].quaternion.copy(bullets[i].quaternion);
	}

	shieldMesh.position.copy(player.position);
	shieldMesh.quaternion.copy(player.quaternion);
}

function render() {
	camera.lookAt(playerMesh.position);
	webglRenderer.render(scene, camera);
}
