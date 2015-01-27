var THREE = require('three');
var CANNON = require('cannon');
var key = require('keymaster');

var world, player, objects=[], shield, timeStep=1/60;
var camera, scene, ground, light, webglRenderer, container;
var playerMesh, playerMiniMesh, objectMeshs=[], objectMiniMeshs=[], shieldMesh;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var CAMERA_START_X = 1000;
var CAMERA_START_Y = 1200;
var CAMERA_START_Z = 0;

var SPEED = 2;

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
	var playerShape = new CANNON.Box(new CANNON.Vec3(30,30,30));
	var objectShape = new CANNON.Box(new CANNON.Vec3(30,30,30));
	var shieldShape = new CANNON.Box(new CANNON.Vec3(60,60,60));

	// Collision filter groups - must be powers of 2!
	var GROUP1 = 1; //player
	var GROUP2 = 2; //shield
	var GROUP3 = 4; //object
	var GROUP4 = 8; //bullet

	//player physics
	player = new CANNON.Body({
		mass: 100
	});
	player.addShape(playerShape);
	player.angularVelocity.set(0,1,0);
	player.angularDamping = 0;
	player.position.x = 0;
	player.position.y = 200;
	player.position.z = 0;
	player.collisionFilterGroup = GROUP1;
	player.collisionFilterMask =  GROUP3;
	player.linearDamping = 0.9;
	world.add(player);

	//shield physics
	shield = new CANNON.Body({
		mass: 1
	});
	shield.addShape(shieldShape);
	shield.angularVelocity.set(0,1,0);
	shield.angularDamping = 0;
	shield.position.x = 0;
	shield.position.y = 200;
	shield.position.z = 0;
	shield.collisionFilterGroup = GROUP2;
	shield.collisionFilterMask =  GROUP4;
	world.add(shield);

	//object physics
	var objectCount = randomIntFromInterval(1, 100);
	for (var i = 0; i < objectCount; i++){
		var mass = randomIntFromInterval(10, 100);
		var object = new CANNON.Body({
			mass: mass
		});
		object.addShape(objectShape);
		var randomX = randomIntFromInterval(-5000, 5000);
		var randomZ = randomIntFromInterval(-5000, 5000);
		object.position.x = randomX;
		object.position.y = 200;
		object.position.z = randomZ;
		object.quaternion.y = randomIntFromInterval(0, 1);
		object.quaternion.x = randomIntFromInterval(0, 1);
		object.linearDamping = 0.9;
		object.collisionFilterGroup = GROUP3;
		object.collisionFilterMask =  GROUP1 | GROUP3;
		objects.push(object);
		world.add(object);
	}
}

function initThree() {

	container = document.createElement('div');
	document.body.appendChild(container);

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
				color: 0xff0000
		});
		var objectMiniMesh = new THREE.Mesh(objectMiniGeometry, objectMiniMaterial);
		scene.add(objectMiniMesh);
		objectMiniMeshs.push(objectMiniMesh);
	}

	//playerMesh
	var playerGeometry = new THREE.BoxGeometry(50, 50, 50);
	var playerMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
	playerMesh.castShadow = true;

	scene.add(playerMesh);

	//playerMiniMesh
	var playerMiniGeometry = new THREE.BoxGeometry(5, 5, 5);
	var playerMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0x000000
	});
	playerMiniMesh = new THREE.Mesh(playerMiniGeometry, playerMiniMaterial);

	scene.add(playerMiniMesh);

	//shield
	var shieldGeometry = new THREE.BoxGeometry(100, 100, 100);
	var shieldMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc,
			transparent: true,
			opacity: 0.3
	});
	shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);

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

function animate() {

	player.angularVelocity.set(0,1,0);

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
