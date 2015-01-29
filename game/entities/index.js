var THREE = require('three');
var CANNON = require('cannon');

// Collision filter groups - must be powers of 2!
var GROUP1 = 1; //player
var GROUP2 = 2; //shield
var GROUP3 = 4; //object
var GROUP4 = 8; //bullet

var LEVEL = 500;

exports.playerPhysics = function(callback) {

	var playerShape = new CANNON.Box(new CANNON.Vec3(30,30,30));

	var player = new CANNON.Body({
		mass: 100
	});
	player.addShape(playerShape);
	player.angularVelocity.set(0,1,0);
	player.angularDamping = 0;
	player.position.x = 0;
	player.position.y = LEVEL;
	player.position.z = 0;
	player.collisionFilterGroup = GROUP1;
	player.collisionFilterMask =  GROUP3;
	player.linearDamping = 0.9;

	return callback(player);
};

exports.playerMesh = function(callback) {

	var playerGeometry = new THREE.BoxGeometry(50, 50, 50);
	var playerMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc
	});
	var playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
	playerMesh.castShadow = true;

	return callback(playerMesh);
};

exports.shieldPhysics = function(callback) {

	var shieldShape = new CANNON.Box(new CANNON.Vec3(60,60,60));

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

exports.shieldMesh = function(callback) {

	var shieldGeometry = new THREE.BoxGeometry(100, 100, 100);
	var shieldMaterial = new THREE.MeshLambertMaterial({
			color: 0xcccccc,
			transparent: true,
			opacity: 0.3
	});
	var shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);

	return callback(shieldMesh);
};
