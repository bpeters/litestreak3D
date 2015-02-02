var THREE = require('three');
var CANNON = require('cannon');

// Collision filter groups - must be powers of 2!
var PLAYER = 1;
var SHIELD = 2;
var OBJECT = 4;
var BULLET = 8;
var VILLAGER = 16;
var HUNTER = 32;
var ENEMY_BULLET = 64;

var LEVEL = 500;

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random()*(max-min+1)+min);
}

exports.groundMesh = function() {

	var groundGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
	var groundMaterial = new THREE.MeshPhongMaterial({
		color: 0xffffff
	});
	var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	groundMesh.rotation.x = -Math.PI / 2;
	groundMesh.position.x = 0;
	groundMesh.position.y = 0;
	groundMesh.position.z = 0;

	return groundMesh;
};

exports.playerPhysics = function(health) {

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
	player.collisionFilterGroup = PLAYER;
	player.collisionFilterMask =  OBJECT | VILLAGER | HUNTER | ENEMY_BULLET;
	player.linearDamping = 0.9;

	return player;
};

exports.playerMesh = function(health) {

	var h = health + 20;

	var playerGeometry = new THREE.BoxGeometry(h, h, h);
	var playerMaterial = new THREE.MeshLambertMaterial({
			color: 0x81B4E4
	});
	var playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
	playerMesh.castShadow = true;

	return playerMesh;
};

exports.playerMiniMesh = function(health) {

	var h = health / 16;

	var playerMiniGeometry = new THREE.BoxGeometry(h, h, h);
	var playerMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0x000000,
			transparent: true,
			opacity: 0.9
	});
	var playerMiniMesh = new THREE.Mesh(playerMiniGeometry, playerMiniMaterial);
	playerMiniMesh.position.y = LEVEL + 200;

	return playerMiniMesh;
};

exports.shieldPhysics = function(shield, health) {

	var s = shield + health;

	var shieldShape = new CANNON.Box(new CANNON.Vec3(s, s, s));

	var body = new CANNON.Body({
		mass: s
	});
	body.addShape(shieldShape);
	body.angularVelocity.set(0,1,0);
	body.angularDamping = 0;
	body.position.x = 0;
	body.position.y = LEVEL;
	body.position.z = 0;
	body.collisionFilterGroup = SHIELD;
	body.collisionFilterMask = ENEMY_BULLET;

	return body;
};

exports.shieldMesh = function(shield, health) {

	var s = shield + health + 20;

	var shieldGeometry = new THREE.BoxGeometry(s, s, s);
	var shieldMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc,
			transparent: true,
			opacity: 0.3
	});
	var shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);

	return shieldMesh;
};

exports.objectPhysics = function() {

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
		object.collisionFilterGroup = OBJECT;
		object.collisionFilterMask =  PLAYER | OBJECT | BULLET | VILLAGER | HUNTER | ENEMY_BULLET;
		objects.push(object);
	}

	return objects;
};

exports.objectMesh = function(objects) {

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
		objectMesh.name = i;
		objectMeshs.push(objectMesh);
	}

	return objectMeshs;
};

exports.objectMiniMesh = function(objects) {

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
		objectMiniMesh.name = i;
		objectMiniMeshs.push(objectMiniMesh);
	}

	return objectMiniMeshs;
};

exports.bulletPhysics = function(data) {

	var m = data.m;

	var bulletShape = new CANNON.Box(new CANNON.Vec3(m,m,m));

	var bullet = new CANNON.Body({
		mass: m
	});
	bullet.addShape(bulletShape);
	bullet.position.x = data.x;
	bullet.position.y = LEVEL;
	bullet.position.z = data.z;
	bullet.angularVelocity.set(10, 10, 10);
	bullet.angularDamping = 0.5;
	bullet.velocity.x = data.velx;
	bullet.velocity.z = data.velz;
	bullet.collisionFilterGroup = BULLET;
	bullet.collisionFilterMask =  OBJECT | BULLET | VILLAGER | HUNTER | ENEMY_BULLET;
	bullet.linearDamping = 0.5;

	return bullet;
};

exports.bulletMesh = function(data) {

	var m = data.m + 5;

	var bulletGeometry = new THREE.BoxGeometry(m, m, m);
	var bulletMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
	bulletMesh.castShadow = true;
	bulletMesh.name = data.name;

	return bulletMesh;
};

exports.villagerPhysics = function() {

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
		villager.collisionFilterGroup = VILLAGER;
		villager.collisionFilterMask =  PLAYER | OBJECT | BULLET | VILLAGER | HUNTER;

		villagers.push(villager);
	}

	return villagers;
};

exports.villagerMesh = function(villagers) {

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
		villagerMesh.name = i;
		villagerMeshs.push(villagerMesh);
	}

	return villagerMeshs;
};

exports.villagerMiniMesh = function(villagers) {

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

	return villagerMiniMeshs;
};

exports.hunterPhysics = function(data) {

	var m = data.m;

	var hunterShape = new CANNON.Box(new CANNON.Vec3(m,m,m));

	var hunter = new CANNON.Body({
		mass: m
	});
	hunter.addShape(hunterShape);
	hunter.position.x = data.x;
	hunter.position.y = LEVEL;
	hunter.position.z = data.z;
	hunter.linearDamping = 0.5;
	hunter.angularVelocity.x = data.aX;
	hunter.angularVelocity.y = data.aY;
	hunter.angularVelocity.z = data.aZ;
	hunter.angularDamping = 0;
	hunter.collisionFilterGroup = HUNTER;
	hunter.collisionFilterMask =  PLAYER | OBJECT | BULLET | VILLAGER | HUNTER;
	hunter.linearDamping = 0.5;

	return hunter;
};

exports.hunterMesh = function(data) {

	var m = data.m + 20;

	var hunterGeometry = new THREE.BoxGeometry(m, m, m);
	var hunterMaterial = new THREE.MeshLambertMaterial({
			color: 0xDE3E5B,
			transparent: true,
			opacity: 0.9
	});
	var hunterMesh = new THREE.Mesh(hunterGeometry, hunterMaterial);
	hunterMesh.receiveShadow = true;
	hunterMesh.castShadow = true;
	hunterMesh.position.x = data.x;
	hunterMesh.position.y = LEVEL;
	hunterMesh.position.z = data.z;
	hunterMesh.name = data.name;

	return hunterMesh;
};

exports.hunterMiniMesh = function(data) {

		var m = data.m / 16;
		var hunterMiniGeometry = new THREE.BoxGeometry(m, m, m);
		var hunterMiniMaterial = new THREE.MeshLambertMaterial({
			color: 0xDE3E5B,
			transparent: true,
			opacity: 0.9
		});
		var hunterMiniMesh = new THREE.Mesh(hunterMiniGeometry, hunterMiniMaterial);
		hunterMiniMesh.position.y = LEVEL + 200;

	return hunterMiniMesh;
};

exports.enemyBulletPhysics = function(data) {

	var m = data.m;

	var enemyBulletShape = new CANNON.Box(new CANNON.Vec3(m,m,m));

	var enemyBullet = new CANNON.Body({
		mass: m
	});
	enemyBullet.addShape(enemyBulletShape);
	enemyBullet.position.x = data.x;
	enemyBullet.position.y = LEVEL;
	enemyBullet.position.z = data.z;
	enemyBullet.angularVelocity.set(10, 10, 10);
	enemyBullet.angularDamping = 0.5;
	enemyBullet.velocity.x = data.velx;
	enemyBullet.velocity.z = data.velz;
	enemyBullet.collisionFilterGroup = ENEMY_BULLET;
	enemyBullet.collisionFilterMask =  OBJECT | BULLET | PLAYER | ENEMY_BULLET | SHIELD;
	enemyBullet.linearDamping = 0.5;

	return enemyBullet;
};

exports.enemyBulletMesh = function(data) {

	var m = data.m + 5;

	var enemyBulletGeometry = new THREE.BoxGeometry(m, m, m);
	var enemyBulletMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var enemyBulletMesh = new THREE.Mesh(enemyBulletGeometry, enemyBulletMaterial);
	enemyBulletMesh.castShadow = true;
	enemyBulletMesh.name = data.name;

	return enemyBulletMesh;
};
