var THREE = require('three');
var CANNON = require('cannon');
var key = require('keymaster');
var entities = require('./entities');

var world, player, bullets=[], objects=[], shield, timeStep=1/60;
var camera, scene, ground, light, webglRenderer, container;
var playerMesh, playerMiniMesh, objectMeshs=[], objectMiniMeshs=[], shieldMesh, bulletMeshs=[];

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

//CANNON shapes
var objectShape = new CANNON.Box(new CANNON.Vec3(30,30,30));
var bulletShape = new CANNON.Box(new CANNON.Vec3(5,5,5));

// Collision filter groups - must be powers of 2!
var GROUP1 = 1; //player
var GROUP2 = 2; //shield
var GROUP3 = 4; //object
var GROUP4 = 8; //bullet

var CAMERA_START_X = 1000;
var CAMERA_START_Y = 1200;
var CAMERA_START_Z = 0;

var SPEED = 10;
var LEVEL = 500;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

initCannon();
initThree();
animate();

function initCannon() {
	world = new CANNON.World();
	world.gravity.set(0,0,0);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

	//player physics
	entities.playerPhysics(function(physics) {
		player = physics;
	});
	world.add(player);

	//shield physics
	entities.shieldPhysics(function(physics) {
		shield = physics;
	});
	world.add(shield);

	//object physics
	var objectCount = randomIntFromInterval(1, 100);
	for (var i = 0; i < objectCount; i++){
		var mass = randomIntFromInterval(10, 100);
		var object = new CANNON.Body({
			mass: mass
		});
		object.addShape(objectShape);
		var randomX = randomIntFromInterval(-2000, 2000);
		var randomZ = randomIntFromInterval(-2000, 2000);
		object.position.x = randomX;
		object.position.y = LEVEL;
		object.position.z = randomZ;
		object.quaternion.y = randomIntFromInterval(0, 1);
		object.quaternion.x = randomIntFromInterval(0, 1);
		object.linearDamping = randomIntFromInterval(0.01, 0.9);
		object.collisionFilterGroup = GROUP3;
		object.collisionFilterMask =  GROUP1 | GROUP3;
		objects.push(object);
		world.add(object);
	}
}

function initThree() {

	container = document.createElement('div');
	document.body.appendChild(container);

	//Add listener for mouse click to shoot bullet
	container.addEventListener('click', spawnBullet, false);

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
	var groundGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
	var groundMaterial = new THREE.MeshPhongMaterial({
		color: 0xffffff
	});
	ground = new THREE.Mesh(groundGeometry, groundMaterial);
	ground.rotation.x = -Math.PI / 2;
	ground.position.x = 0;
	ground.position.y = 0;
	ground.position.z = 0;

	scene.add(ground);

	//object
	for (var i = 0; i < objects.length; i++) {
		var objectGeometry = new THREE.BoxGeometry(50, 50, 50);
		var objectMaterial = new THREE.MeshPhongMaterial({
			color: 0xaaaaaa
		});
		var objectMesh = new THREE.Mesh(objectGeometry, objectMaterial);
		objectMesh.receiveShadow = true;
		objectMesh.castShadow = true;
		scene.add(objectMesh);
		objectMeshs.push(objectMesh);
	}

	//objectMiniMesh
	for (var m = 0; m < objects.length; m++) {
		var objectMiniGeometry = new THREE.BoxGeometry(5, 5, 5);
		var objectMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0.3
		});
		var objectMiniMesh = new THREE.Mesh(objectMiniGeometry, objectMiniMaterial);
		objectMiniMesh.position.y = LEVEL;
		scene.add(objectMiniMesh);
		objectMiniMeshs.push(objectMiniMesh);
	}

	//playerMesh
	entities.playerMesh(function(mesh) {
		playerMesh = mesh;
	});
	scene.add(playerMesh);

	//playerMiniMesh
	var playerMiniGeometry = new THREE.BoxGeometry(5, 5, 5);
	var playerMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0x000000
	});
	playerMiniMesh = new THREE.Mesh(playerMiniGeometry, playerMiniMaterial);
	playerMiniMesh.position.y = LEVEL;
	scene.add(playerMiniMesh);

	//shield
	entities.shieldMesh(function(mesh) {
		shieldMesh = mesh;
	});
	scene.add(shieldMesh);

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

	var r = Math.atan2(e.clientY - (window.innerHeight / 2), e.clientX - (window.innerWidth / 2));
	console.log(r);

	var vely = Math.sin(r) * 100;
	var velx =  Math.cos(r) * 100;

	console.log(velx + '-' + vely);

	//bullet physics
	var bullet = new CANNON.Body({
		mass: 100
	});
	bullet.addShape(bulletShape);
	bullet.position.x = player.position.x;
	bullet.position.y = LEVEL;
	bullet.position.z = player.position.z;
	bullet.angularVelocity.set(10, 10, 0);
	bullet.angularDamping = 0.9;
	bullet.velocity.z = vely;
	bullet.velocity.x = velx;
	bullet.collisionFilterGroup = GROUP4;
	bullet.collisionFilterMask =  GROUP3;
	bullet.linearDamping = 0.9;
	world.add(bullet);

	//bullet mesh
	var bulletGeometry = new THREE.BoxGeometry(10, 10, 10);
	var bulletMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
	bulletMesh.castShadow = true;
	scene.add(bulletMesh);

	bullets.push(bullet);
	bulletMeshs.push(bulletMesh);
}

function animate() {

	player.position.y = LEVEL;

	//playerMesh input
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

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

function render() {
	camera.lookAt(playerMesh.position);
	webglRenderer.render(scene, camera);
}
