var THREE = require('three');
var CANNON = require('cannon');

// Collision filter groups - must be powers of 2!
var GROUP1 = 1; //player
var GROUP2 = 2; //shield
var GROUP3 = 4; //object
var GROUP4 = 8; //bullet
var GROUP5 = 16; //villager

var LEVEL = 500;

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

exports.groundMesh = function(callback) {

	var groundGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
	var groundMaterial = new THREE.MeshPhongMaterial({
		color: 0xffffff
	});
	var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	groundMesh.rotation.x = -Math.PI / 2;
	groundMesh.position.x = 0;
	groundMesh.position.y = 0;
	groundMesh.position.z = 0;

	return callback(groundMesh);
};

exports.playerPhysics = function(health, callback) {

	var playerShape = new CANNON.Box(new CANNON.Vec3(health, health, health));

	var player = new CANNON.Body({
		mass: health
	});
	player.addShape(playerShape);
	player.angularVelocity.set(0,1,0);
	player.angularDamping = 0;
	player.position.x = 0;
	player.position.y = LEVEL;
	player.position.z = 0;
	player.collisionFilterGroup = GROUP1;
	player.collisionFilterMask =  GROUP3 | GROUP5;
	player.linearDamping = 0.9;

	return callback(player);
};

exports.playerMesh = function(health, callback) {

	var h = health + 20;

	var playerGeometry = new THREE.BoxGeometry(h, h, h);
	var playerMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
	playerMesh.castShadow = true;

	return callback(playerMesh);
};

exports.playerMiniMesh = function(health, callback) {

	var h = health / 16;

	var playerMiniGeometry = new THREE.BoxGeometry(h, h, h);
	var playerMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0x000000,
			transparent: true,
			opacity: 0.9
	});
	var playerMiniMesh = new THREE.Mesh(playerMiniGeometry, playerMiniMaterial);
	playerMiniMesh.position.y = LEVEL + 200;

	return callback(playerMiniMesh);
};

exports.shieldPhysics = function(shield, health, callback) {

	var s = shield + health;

	var shieldShape = new CANNON.Box(new CANNON.Vec3(s, s, s));

	var shield = new CANNON.Body({
		mass: 1
	});
	shield.addShape(shieldShape);
	shield.angularVelocity.set(0,1,0);
	shield.angularDamping = 0;
	shield.position.x = 0;
	shield.position.y = LEVEL;
	shield.position.z = 0;
	shield.collisionFilterGroup = GROUP2;
	shield.collisionFilterMask =  GROUP4;

	return callback(shield);
};

exports.shieldMesh = function(shield, health, callback) {

	var s = shield + health;

	var shieldGeometry = new THREE.BoxGeometry(s, s, s);
	var shieldMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc,
			transparent: true,
			opacity: 0.3
	});
	var shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);

	return callback(shieldMesh);
};

exports.objectPhysics = function(callback) {

	var objectCount = randomIntFromInterval(1, 100);
	var objects = [];

	for (var i = 0; i < objectCount; i++){
		var mass = randomIntFromInterval(10, 100);
		var objectShape = new CANNON.Box(new CANNON.Vec3(mass,mass,mass));
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
		object.collisionFilterMask =  GROUP1 | GROUP3 | GROUP4 | GROUP5;
		objects.push(object);
	}

	return callback(objects);
};

exports.objectMesh = function(objects, callback) {

	var objectMeshs = [];

	for (var i = 0; i < objects.length; i++) {
		var m = objects[i].mass + 20;
		var objectGeometry = new THREE.BoxGeometry(m, m, m);
		var objectMaterial = new THREE.MeshPhongMaterial({
			color: 0xaaaaaa
		});
		var objectMesh = new THREE.Mesh(objectGeometry, objectMaterial);
		objectMesh.receiveShadow = true;
		objectMesh.castShadow = true;
		objectMeshs.push(objectMesh);
	}

	return callback(objectMeshs);
};

exports.objectMiniMesh = function(objects, callback) {

	var objectMiniMeshs = [];

	for (var i = 0; i < objects.length; i++) {
		var m = objects[i].mass / 16;
		var objectMiniGeometry = new THREE.BoxGeometry(m, m, m);
		var objectMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0xff0000,
			transparent: true,
			opacity: 0.3
		});
		var objectMiniMesh = new THREE.Mesh(objectMiniGeometry, objectMiniMaterial);
		objectMiniMesh.position.y = LEVEL + 200;
		objectMiniMeshs.push(objectMiniMesh);
	}

	return callback(objectMiniMeshs);
};

exports.bulletPhysics = function(data, callback) {

	var bulletShape = new CANNON.Box(new CANNON.Vec3(5,5,5));

	var bullet = new CANNON.Body({
		mass: 100
	});
	bullet.addShape(bulletShape);
	bullet.position.x = data.x;
	bullet.position.y = LEVEL;
	bullet.position.z = data.z;
	bullet.angularVelocity.set(10, 10, 10);
	bullet.angularDamping = 0.5;
	bullet.velocity.x = data.velx;
	bullet.velocity.z = data.velz;
	bullet.collisionFilterGroup = GROUP4;
	bullet.collisionFilterMask =  GROUP3 | GROUP4 | GROUP5;
	bullet.linearDamping = 0.5;

	return callback(bullet);
};

exports.bulletMesh = function(callback) {

	var bulletGeometry = new THREE.BoxGeometry(10, 10, 10);
	var bulletMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
	bulletMesh.castShadow = true;

	return callback(bulletMesh);
};

exports.villagerPhysics = function(callback) {

	var villagerCount = randomIntFromInterval(10, 30);
	var villagers = [];

	for (var i = 0; i < villagerCount; i++){
		var mass = randomIntFromInterval(30, 60);
		var villagerShape = new CANNON.Box(new CANNON.Vec3(mass,mass,mass));
		var villager = new CANNON.Body({
			mass: mass
		});
		villager.addShape(villagerShape);
		var randomX = randomIntFromInterval(-2000, 2000);
		var randomZ = randomIntFromInterval(-2000, 2000);
		var spin = randomIntFromInterval(1, 3);
		villager.position.x = randomX;
		villager.position.y = LEVEL;
		villager.position.z = randomZ;
		villager.linearDamping = 0.5;
		villager.angularVelocity.set(1,spin,1);
		villager.angularDamping = 0;
		villager.collisionFilterGroup = GROUP5;
		villager.collisionFilterMask =  GROUP1 | GROUP3 | GROUP4 | GROUP5;
		villagers.push(villager);
	}

	return callback(villagers);
};

exports.villagerMesh = function(villagers, callback) {

	var villagerMeshs = [];

	for (var i = 0; i < villagers.length; i++) {
		var m = villagers[i].mass + 20;
		var villagerGeometry = new THREE.BoxGeometry(m, m, m);
		var villagerMaterial = new THREE.MeshPhongMaterial({
			color: 0x81B4E4
		});
		var villagerMesh = new THREE.Mesh(villagerGeometry, villagerMaterial);
		villagerMesh.receiveShadow = true;
		villagerMesh.castShadow = true;
		villagerMeshs.push(villagerMesh);
	}

	return callback(villagerMeshs);
};

exports.villagerMiniMesh = function(villagers, callback) {

	var villagerMiniMeshs = [];

	for (var i = 0; i < villagers.length; i++) {
		var m = villagers[i].mass / 16;
		var villagerMiniGeometry = new THREE.BoxGeometry(m, m, m);
		var villagerMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0x81B4E4,
			transparent: true,
			opacity: 0.9
		});
		var villagerMiniMesh = new THREE.Mesh(villagerMiniGeometry, villagerMiniMaterial);
		villagerMiniMesh.position.y = LEVEL + 200;
		villagerMiniMeshs.push(villagerMiniMesh);
	}

	return callback(villagerMiniMeshs);
};
