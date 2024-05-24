const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreenDiv = document.getElementById('startScreen');
const gameOverDiv = document.getElementById('gameOver');
const weaponInfoDiv = document.getElementById('weaponInfo');
const weaponIconDiv = document.getElementById('weaponIcon');
const weaponTextDiv = document.getElementById('weaponText');
const currentScoreText = document.getElementById('currentScore');
const highScoreText = document.getElementById('highScore');
const weaponTimerText = document.getElementById('weaponTimer');
const difficultyLevelText = document.getElementById('difficultyLevel');
const healthBar = document.getElementById('healthBar');
const healthText = document.getElementById('healthText');
const powerUpIndicators = document.getElementById('powerUpIndicators');

let isPaused = false;

let activeIntervals = [];


const playerImg = new Image();
playerImg.src = 'player.png';

const basicEnemyImg = new Image();
basicEnemyImg.src = 'basic_enemy_v2.png';

const fastEnemyImg = new Image();
fastEnemyImg.src = 'fast_enemy.png';

const slowEnemyImg = new Image();
slowEnemyImg.src = 'slow_enemy.png';

const zigzagEnemyImg = new Image();
zigzagEnemyImg.src = 'zigzag_enemy.png';

const largeEnemyImg = new Image();
largeEnemyImg.src = 'large_enemy.png';

const rangedEnemyImg = new Image();
rangedEnemyImg.src = 'ranged_enemy.png';

const teleportingEnemyImg = new Image();
teleportingEnemyImg.src = 'teleporting_enemy.png';

const splittingEnemyImg = new Image();
splittingEnemyImg.src = 'splitting_enemy.png';

const shieldPowerUpImg = new Image();
shieldPowerUpImg.src = 'shield_powerup.png';

const speedBoostPowerUpImg = new Image();
speedBoostPowerUpImg.src = 'speed_boost_powerup.png';

const healthRestorePowerUpImg = new Image();
healthRestorePowerUpImg.src = 'health_restore_powerup.png';

const hazardImg = new Image();
hazardImg.src = 'hazard.png';

// Add new weapon images
const rapidWeaponImg = new Image();
rapidWeaponImg.src = 'rapid_weapon.png';

const spreadWeaponImg = new Image();
spreadWeaponImg.src = 'spread_weapon.png';

const doubleWeaponImg = new Image();
doubleWeaponImg.src = 'double_weapon.png';

const tripleWeaponImg = new Image();
tripleWeaponImg.src = 'triple_weapon.png';

const quadWeaponImg = new Image();
quadWeaponImg.src = 'quad_weapon.png';

const diagonalWeaponImg = new Image();
diagonalWeaponImg.src = 'diagonal_weapon.png';

const backwardWeaponImg = new Image();
backwardWeaponImg.src = 'backward_weapon.png';

const bomberWeaponImg = new Image();
bomberWeaponImg.src = 'bomber_weapon.png';

const fireballWeaponImg = new Image();
fireballWeaponImg.src = 'fireball_weapon.png';

const lightningWeaponImg = new Image();
lightningWeaponImg.src = 'lightning_weapon.png';

const bouncingWeaponImg = new Image();
bouncingWeaponImg.src = 'bouncing_weapon.png';

const homingWeaponImg = new Image();
homingWeaponImg.src = 'homing_weapon.png';

const laserWeaponImg = new Image();
laserWeaponImg.src = 'laser_weapon.png';

// Initial player state
const initialPlayerState = {
    x: 50,
    y: 50,
    radius: 20,
    speed: 2,
    direction: 'right',
    weapon: 'normal',
    shield: false,
    shieldDuration: 5000,
    health: 200, // Increased from 100 to 200
    maxHealth: 200, // Increased from 100 to 200
    speedBoost: false,
    speedBoostDuration: 5000,
    weaponDuration: 0
};

const player = { ...initialPlayerState };

const bullets = [];
const bulletSpeed = 5;
const bulletRadius = 5;
const enemies = [];
const enemySpeed = 1;
const enemyRadius = 20;
const enemyBullets = [];
const enemyBulletSpeed = 3;
const weapons = [];
const powerUps = [];
const hazards = [];
const explosions = [];

let score = 0;
let gameOver = false;
let highScore = localStorage.getItem('highScore') || 0;
let weaponTimer = 0;
let level = 1;
let difficulty = 1;
let enemySpawnInterval = 2000;
let enemySpawnIntervalID;

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    Enter: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && startScreenDiv.style.display !== 'none') {
        startGame();
    } else if (e.key === 'Enter' && gameOver) {
        restartGame();
    } else if (e.key === 'Enter') {
        togglePause();
    } else if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    if (e.key === ' ') {
        shootBullet();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});



function togglePause() {
    if (gameOver) {
        restartGame();
    } else {
        isPaused = !isPaused;
        if (!isPaused) {
            activeIntervals.forEach(interval => {
                interval.id = setInterval(interval.callback, interval.delay);
            });
            gameLoop();
        } else {
            activeIntervals.forEach(interval => {
                clearInterval(interval.id);
            });
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '40px Arial';
            ctx.fillText('Paused', canvas.width / 2 - 60, canvas.height / 2);
        }
    }
}

function addInterval(callback, delay) {
    const interval = { callback, delay, id: setInterval(callback, delay) };
    activeIntervals.push(interval);
    return interval.id;
}

function clearAllIntervals() {
    activeIntervals.forEach(interval => {
        clearInterval(interval.id);
    });
    activeIntervals = [];
}


function updateHealthBar() {
    const healthPercentage = (player.health / player.maxHealth) * 100;
    healthBar.style.width = `${healthPercentage}%`;
    healthText.textContent = `${player.health} / ${player.maxHealth}`;
    const green = Math.floor((player.health / player.maxHealth) * 255);
    const red = 255 - green;
    healthBar.style.backgroundColor = `rgb(${red},${green},0)`;
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bulletRadius + enemy.radius) {
                enemy.health -= 20;
                if (enemy.health <= 0) {
                    handleEnemyDeath(enemyIndex, enemy);
                }
                bullets.splice(bulletIndex, 1);
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < player.radius + enemy.radius) {
            if (!player.shield) {
                player.health -= enemy.damage / 4; // Reduced damage from enemies
                updateHealthBar();
                if (player.health <= 0) {
                    gameOver = true;
                    updateScores();
                    gameOverDiv.style.opacity = 1;
                    return;
                }
            }
        }
    });

    enemyBullets.forEach((bullet, bulletIndex) => {
        const dist = Math.hypot(player.x - bullet.x, player.y - bullet.y);
        if (dist < player.radius + bulletRadius) {
            if (!player.shield) {
                player.health -= 2; // Reduced damage from enemy bullets
                updateHealthBar();
                enemyBullets.splice(bulletIndex, 1);
                if (player.health <= 0) {
                    gameOver = true;
                    updateScores();
                    gameOverDiv.style.opacity = 1;
                    return;
                }
            }
        }

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            enemyBullets.splice(bulletIndex, 1);
        }
    });

    hazards.forEach((hazard, hazardIndex) => {
        const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
        if (dist < player.radius + hazard.radius) {
            if (!player.shield) {
                player.health -= hazard.damage / 4; // Reduced damage from hazards
                updateHealthBar();
                if (player.health <= 0) {
                    gameOver = true;
                    updateScores();
                    gameOverDiv.style.opacity = 1;
                    return;
                }
            }
        }
    });
}


function startGame() {
    startScreenDiv.style.display = 'none';
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    gameOverDiv.style.opacity = 0;
    clearAllIntervals(); // Clear any existing intervals
    addInterval(createEnemy, enemySpawnInterval);
    addInterval(createWeapon, 10000);  // Spawn a weapon every 10 seconds
    addInterval(createPowerUp, 15000);
    addInterval(createHazard, 12000);
    gameLoop();
}

function restartGame() {
    gameOver = false;
    Object.assign(player, initialPlayerState);
    bullets.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
    weapons.length = 0;
    powerUps.length = 0;
    hazards.length = 0;
    score = 0;
    level = 1;
    difficulty = 1;
    enemySpawnInterval = 2000;
    clearAllIntervals(); // Clear any existing intervals
    addInterval(createEnemy, enemySpawnInterval);
    gameOverDiv.style.opacity = 0;
    updateDifficultyLevel();
    updateHealthBar(); // Reset health bar
    gameLoop();
}


function gameLoop() {
    if (gameOver || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayer();
    drawPlayer();
    updateBullets();
    drawBullets();
    updateEnemies();
    drawEnemies();
    updateEnemyBullets();
    drawEnemyBullets();
    updateWeapons();
    drawWeapons();
    updatePowerUps();
    drawPowerUps();
    updateHazards();
    drawHazards();
    checkCollisions();
    drawScore();
    updateWeaponInfo();
    updateWeaponTimer();
    updateDifficultyLevel();
    updateExplosions();
    drawExplosions();
drawChainEffect(); 
    increaseDifficulty();
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    let nextX = player.x;
    let nextY = player.y;

    if (keys.ArrowUp) {
        nextY -= player.speed;
        player.direction = keys.ArrowLeft ? 'up-left' : (keys.ArrowRight ? 'up-right' : 'up');
    }
    if (keys.ArrowDown) {
        nextY += player.speed;
        player.direction = keys.ArrowLeft ? 'down-left' : (keys.ArrowRight ? 'down-right' : 'down');
    }
    if (keys.ArrowLeft) {
        nextX -= player.speed;
        if (!keys.ArrowUp && !keys.ArrowDown) player.direction = 'left';
    }
    if (keys.ArrowRight) {
        nextX += player.speed;
        if (!keys.ArrowUp && !keys.ArrowDown) player.direction = 'right';
    }

    player.x = (nextX + canvas.width) % canvas.width;
    player.y = (nextY + canvas.height) % canvas.height;

    weapons.forEach((weapon, index) => {
        const dist = Math.hypot(player.x - weapon.x, player.y - weapon.y);
        if (dist < player.radius + weapon.radius) {
            player.weapon = weapon.type;
            player.weaponDuration = 10000;
            weapons.splice(index, 1);
        }
    });

    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);
        if (dist < player.radius + powerUp.radius) {
            activatePowerUp(powerUp.type);
            powerUps.splice(index, 1);
        }
    });

    if (player.weapon !== 'normal') {
        player.weaponDuration -= 16.67;
        if (player.weaponDuration <= 0) {
            player.weapon = 'normal';
            player.weaponDuration = 0;
        }
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    switch (player.direction) {
        case 'up':
            ctx.rotate(-Math.PI / 2);
            break;
        case 'down':
            ctx.rotate(Math.PI / 2);
            break;
        case 'left':
            ctx.rotate(Math.PI);
            break;
        case 'up-left':
            ctx.rotate(-Math.PI / 4);
            break;
        case 'up-right':
            ctx.rotate(-Math.PI / 4 * 3);
            break;
        case 'down-left':
            ctx.rotate(Math.PI / 4);
            break;
        case 'down-right':
            ctx.rotate(Math.PI / 4 * 3);
            break;
    }
    ctx.drawImage(playerImg, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
    ctx.restore();

    if (player.shield) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }
}

function updateBullets() {
    bullets.forEach((bullet, index) => {

	let previousX = bullet.x;
        let previousY = bullet.y;

        switch (bullet.type) {
            case 'fireball':
                updateFireball(bullet);
		break;
            case 'lightning':
               updateLightningBolt(bullet);

                break;
            case 'bouncing':
                moveBullet(bullet);
                checkBounce(bullet);
                break;
            case 'homing':
                moveHomingBullet(bullet);
                break;
            case 'laser':
                updateLaserBeam(bullet);
                checkLaserBeamCollision(bullet);
                break;
	case 'bomber':
                updateBomberBullet(bullet);
                break;
            default:
                moveBullet(bullet);
        }

	 // Check if the bullet is stationary
        if (bullet.x === previousX && bullet.y === previousY) {
            bullet.stationaryTime += 16.67; // Increment stationary time
        } else {
            bullet.stationaryTime = 0; // Reset stationary time
        }

        // Remove bullet if it has been stationary for more than 3 seconds (3000 ms)
        if (bullet.stationaryTime >= 3000) {
            bullets.splice(index, 1);
        }


        if (bullet.y < 0 || bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }
    });
}

function moveBullet(bullet) {
    switch (bullet.direction) {
        case 'up':
            bullet.y -= bulletSpeed;
            break;
        case 'down':
            bullet.y += bulletSpeed;
            break;
        case 'left':
            bullet.x -= bulletSpeed;
            break;
        case 'right':
            bullet.x += bulletSpeed;
            break;
        case 'up-left':
            bullet.x -= bulletSpeed / Math.sqrt(2);
            bullet.y -= bulletSpeed / Math.sqrt(2);
            break;
        case 'up-right':
            bullet.x += bulletSpeed / Math.sqrt(2);
            bullet.y -= bulletSpeed / Math.sqrt(2);
            break;
        case 'down-left':
            bullet.x -= bulletSpeed / Math.sqrt(2);
            bullet.y += bulletSpeed / Math.sqrt(2);
            break;
        case 'down-right':
            bullet.x += bulletSpeed / Math.sqrt(2);
            bullet.y += bulletSpeed / Math.sqrt(2);
            break;
    }
}

function applyBurnEffect(enemy) {
    if (enemy.burnDuration > 0) {
        enemy.burnDuration -= 16.67; // Update burn duration
        enemy.health -= enemy.burnDamage; // Apply burn damage

        if (enemy.health <= 0) {
            enemies.splice(enemies.indexOf(enemy), 1);
            score += player.doubleScore ? 20 : 10; 
        }
    }
}

function applyChainEffect(enemy) {
    if (enemy.chainDuration > 0) {
        enemy.chainDuration -= 16.67; // Update chain duration
        enemy.health -= enemy.chainDamage; // Apply chain damage

        if (enemy.health <= 0) {
            enemies.splice(enemies.indexOf(enemy), 1);
            score += player.doubleScore ? 20 : 10; 
        }
    }
}


function checkBounce(bullet) {
    if (bullet.x <= 0 || bullet.x >= canvas.width) {
        bullet.direction = bullet.direction.includes('left') ? bullet.direction.replace('left', 'right') : bullet.direction.replace('right', 'left');
        bullet.bounces--;
    }
    if (bullet.y <= 0 || bullet.y >= canvas.height) {
        bullet.direction = bullet.direction.includes('up') ? bullet.direction.replace('up', 'down') : bullet.direction.replace('down', 'up');
        bullet.bounces--;
    }
    if (bullet.bounces <= 0) {
        bullets.splice(bullets.indexOf(bullet), 1);
    }
}

function moveHomingBullet(bullet) {
    if (bullet.target) {
        const angle = Math.atan2(bullet.target.y - bullet.y, bullet.target.x - bullet.x);
        bullet.x += Math.cos(angle) * bulletSpeed;
        bullet.y += Math.sin(angle) * bulletSpeed;
    } else {
        moveBullet(bullet);
    }
}

function updateLaserBeam(beam) {
    beam.duration -= 16.67; // Reduce the duration over time
    if (beam.duration <= 0) {
        bullets.splice(bullets.indexOf(beam), 1); // Remove the beam when the duration is up
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        if (bullet.type === 'laser') {
            drawLaserBeam(bullet);
        } else if (bullet.type === 'fireball') {
            drawFireball(bullet);
        } else if (bullet.type === 'lightning'){
	    drawLightningBolt(bullet);

	} else if (bullet.type === 'bomber'){
           drawBomberBullet(bullet);

	} else {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
            ctx.fillStyle = getBulletColor(bullet.type);
            ctx.fill();
            ctx.closePath();
        }
    });
}


function drawBomberBullet(bullet) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'brown';
    ctx.fill();
    ctx.closePath();
}


function handleEnemyDeath(enemyIndex, enemy) {
    if (enemy.type === 'splitting' && enemy.radius > enemyRadius / 2) {
        const newRadius = enemy.radius / 2;
        createEnemy('splitting', enemy.x + newRadius, enemy.y + newRadius, newRadius, enemy.health / 2);
        createEnemy('splitting', enemy.x - newRadius, enemy.y - newRadius, newRadius, enemy.health / 2);
    }
    enemies.splice(enemyIndex, 1);
    score += player.doubleScore ? 20 : 10;
}

function drawLaserBeam(beam) {
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;

    switch (beam.direction) {
        case 'up':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(beam.x, 0);
            break;
        case 'down':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(beam.x, canvas.height);
            break;
        case 'left':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(0, beam.y);
            break;
        case 'right':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(canvas.width, beam.y);
            break;
        case 'up-left':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(0, 0);
            break;
        case 'up-right':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(canvas.width, 0);
            break;
        case 'down-left':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(0, canvas.height);
            break;
        case 'down-right':
            ctx.moveTo(beam.x, beam.y);
            ctx.lineTo(canvas.width, canvas.height);
            break;
    }

    ctx.stroke();
    ctx.closePath();
}

function checkLaserBeamCollision(beam) {
    enemies.forEach((enemy, index) => {
        const distX = Math.abs(enemy.x - beam.x);
        const distY = Math.abs(enemy.y - beam.y);

        switch (beam.direction) {
            case 'up':
            case 'down':
                if (distX < enemy.radius) {
                    enemy.health -= 10;
                    if (enemy.health <= 0) {
                        enemies.splice(index, 1);
                        score += 10;
                    }
                }
                break;
            case 'left':
            case 'right':
                if (distY < enemy.radius) {
                    enemy.health -= 10;
                    if (enemy.health <= 0) {
                        enemies.splice(index, 1);
                        score += player.doubleScore ? 20 : 10; 
                    }
                }
                break;
            case 'up-left':
            case 'up-right':
            case 'down-left':
            case 'down-right':
                const diagonalDist = Math.hypot(enemy.x - beam.x, enemy.y - beam.y);
                if (diagonalDist < enemy.radius) {
                    enemy.health -= 10;
                    if (enemy.health <= 0) {
                        enemies.splice(index, 1);
                        score += player.doubleScore ? 20 : 10; 
                    }
                }
                break;
        }
    });
}


function getBulletColor(type) {
    switch (type) {
        case 'fireball':
            return 'orange';
        case 'lightning':
            return 'yellow';
        case 'bouncing':
            return 'blue';
        case 'homing':
            return 'green';
        case 'laser':
            return 'red';
        default:
            return 'red';
    }
}

function findNearestEnemy(x, y) {
    let nearestEnemy = null;
    let shortestDistance = Infinity;
    enemies.forEach(enemy => {
        const dist = Math.hypot(x - enemy.x, y - enemy.y);
        if (dist < shortestDistance) {
            shortestDistance = dist;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

function createWeapon() {
    const weaponTypes = ['rapid', 'spread', 'double', 'triple', 'quad', 'diagonal', 'backward','fireball','lightning','homing','laser'];
//const weaponTypes = ['bomber'];
    const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    weapons.push({ x, y, radius: 10, type, lifetime: 10000 });
}


function createPowerUp() {
    const powerUpTypes = ['shield', 'speedBoost', 'healthRestore', 'invisibilityCloak', 'magnet', 'timeFreeze', 'doubleScore'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    powerUps.push({ x, y, radius: 15, type, lifetime: 10000 });
}

// Increase frequency of creating health restore power-ups
setInterval(() => createPowerUp('healthRestore'), 10000);

function createHazard() {
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    const lifetime = 5000;
    hazards.push({ x, y, radius: 15, damage: 5, lifetime });
}

function updateWeapons() {
    weapons.forEach((weapon, index) => {
        weapon.lifetime -= 16.67;
        if (weapon.lifetime <= 0) {
            weapons.splice(index, 1);
        }
    });
}


function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.lifetime -= 16.67;
        if (powerUp.lifetime <= 0) {
            powerUps.splice(index, 1);
        }
    });
}

function updateHazards() {
    hazards.forEach((hazard, index) => {
        hazard.lifetime -= 16.67;
        if (hazard.lifetime <= 0) {
            hazards.splice(index, 1);
        }
    });
}

function activatePowerUp(type) {
    const powerUpIcon = document.createElement('div');
    powerUpIcon.className = 'power-up-icon';

    switch (type) {
        case 'shield':
            player.shield = true;
            powerUpIcon.textContent = '🛡️';
            setTimeout(() => {
                player.shield = false;
                powerUpIndicators.removeChild(powerUpIcon);
            }, player.shieldDuration);
            break;
        case 'speedBoost':
            player.speedBoost = true;
            player.speed *= 2;
            powerUpIcon.textContent = '⚡';
            setTimeout(() => {
                player.speedBoost = false;
                player.speed /= 2;
                powerUpIndicators.removeChild(powerUpIcon);
            }, player.speedBoostDuration);
            break;
        case 'healthRestore':
            player.health = Math.min(player.maxHealth, player.health + 100); // Increased restore amount
            updateHealthBar();
            powerUpIcon.textContent = '❤️';
            setTimeout(() => {
                powerUpIndicators.removeChild(powerUpIcon);
            }, 5000);
            break;
        case 'invisibilityCloak':
            player.invisible = true;
            powerUpIcon.textContent = '🕶️';
            setTimeout(() => {
                player.invisible = false;
                powerUpIndicators.removeChild(powerUpIcon);
            }, 10000);
            break;
        case 'magnet':
            player.magnet = true;
            powerUpIcon.textContent = '🧲';
            setTimeout(() => {
                player.magnet = false;
                powerUpIndicators.removeChild(powerUpIcon);
            }, 15000);
            break;
        case 'timeFreeze':
            enemies.forEach(enemy => enemy.frozen = true);
            powerUpIcon.textContent = '⏳';
            setTimeout(() => {
                enemies.forEach(enemy => enemy.frozen = false);
                powerUpIndicators.removeChild(powerUpIcon);
            }, 5000);
            break;
        case 'doubleScore':
            player.doubleScore = true;
            powerUpIcon.textContent = '✖️2';
            setTimeout(() => {
                player.doubleScore = false;
                powerUpIndicators.removeChild(powerUpIcon);
            }, 20000);
            break;
    }

    powerUpIndicators.appendChild(powerUpIcon);
}


function shootBullet() {
    switch (player.weapon) {
        case 'normal':
            createBullet(player.x, player.y, player.direction);
            break;
        case 'rapid':
            for (let i = 0; i < 3; i++) {
                setTimeout(() => createBullet(player.x, player.y, player.direction), i * 100);
            }
            break;
        case 'spread':
            createBullet(player.x, player.y, player.direction);
            createBullet(player.x, player.y, getNextDirection(player.direction, 'left'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'right'));
            break;
        case 'double':
            createBullet(player.x, player.y, player.direction);
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backward'));
            break;
        case 'triple':
            createBullet(player.x, player.y, player.direction);
            createBullet(player.x, player.y, getNextDirection(player.direction, 'left'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'right'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backward'));
            break;
        case 'quad':
            createBullet(player.x, player.y, player.direction);
            createBullet(player.x, player.y, getNextDirection(player.direction, 'left'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'right'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backward'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backwardLeft'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backwardRight'));
            break;
        case 'diagonal':
            createBullet(player.x, player.y, getNextDirection(player.direction, 'leftDiagonal'));
            createBullet(player.x, player.y, getNextDirection(player.direction, 'rightDiagonal'));
            break;
        case 'backward':
            createBullet(player.x, player.y, getNextDirection(player.direction, 'backward'));
            break;
        case 'bomber':
            createBomberBullet(player.x, player.y, player.direction);
            break;
        case 'fireball':
            createFireball(player.x, player.y, player.direction);
            break;
        case 'lightning':
            createLightningBolt(player.x, player.y, player.direction);
            break;
        case 'bouncing':
            createBouncingBullet(player.x, player.y, player.direction);
            break;
        case 'homing':
            createHomingMissile(player.x, player.y);
            break;
        case 'laser':
            createLaserBeam(player.x, player.y, player.direction);
            break;
    }
}

function createBullet(x, y, direction) {
    const bullet = { x, y, direction, type: 'normal', stationaryTime: 0 };

    switch (direction) {
        case 'up':
            bullet.y -= player.radius;
            break;
        case 'down':
            bullet.y += player.radius;
            break;
        case 'left':
            bullet.x -= player.radius;
            break;
        case 'right':
            bullet.x += player.radius;
            break;
        case 'up-left':
            bullet.x -= player.radius / Math.sqrt(2);
            bullet.y -= player.radius / Math.sqrt(2);
            break;
        case 'up-right':
            bullet.x += player.radius / Math.sqrt(2);
            bullet.y -= player.radius / Math.sqrt(2);
            break;
        case 'down-left':
            bullet.x -= player.radius / Math.sqrt(2);
            bullet.y += player.radius / Math.sqrt(2);
            break;
        case 'down-right':
            bullet.x += player.radius / Math.sqrt(2);
            bullet.y += player.radius / Math.sqrt(2);
            break;
    }
    bullets.push(bullet);
}

function getNextDirection(currentDirection, change) {
    const directions = ['up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left', 'up-left'];

    let currentIndex = directions.indexOf(currentDirection);

    switch (change) {
        case 'left':
            currentIndex = (currentIndex + 7) % 8;  // One step to the left
            break;
        case 'right':
            currentIndex = (currentIndex + 1) % 8;  // One step to the right
            break;
        case 'backward':
            currentIndex = (currentIndex + 4) % 8;  // Opposite direction
            break;
        case 'backwardLeft':
            currentIndex = (currentIndex + 5) % 8;  // Opposite and one step to the left
            break;
        case 'backwardRight':
            currentIndex = (currentIndex + 3) % 8;  // Opposite and one step to the right
            break;
        case 'leftDiagonal':
            currentIndex = (currentIndex + 6) % 8;  // Diagonal to the left
            break;
        case 'rightDiagonal':
            currentIndex = (currentIndex + 2) % 8;  // Diagonal to the right
            break;
    }

    return directions[currentIndex];
}


function createBomberBullet(x, y, direction) {
    const bullet = { x, y, direction, type: 'bomber', stationaryTime: 0  };
    switch (direction) {
        case 'up':
            bullet.y -= player.radius;
            break;
        case 'down':
            bullet.y += player.radius;
            break;
        case 'left':
            bullet.x -= player.radius;
            break;
        case 'right':
            bullet.x += player.radius;
            break;
    }
    bullets.push(bullet);
}

function updateBomberBullet(bullet) {
    moveBullet(bullet);

    // Check for collisions and trigger explosion
    checkBomberBulletCollision(bullet);
}


function checkBomberBulletCollision(bullet) {
    enemies.forEach((enemy, index) => {
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist < bulletRadius + enemy.radius) {
            createExplosion(bullet.x, bullet.y);
            bullets.splice(bullets.indexOf(bullet), 1);
        }
    });

    // Check for collision with walls or other obstacles
    if (bullet.x <= 0 || bullet.x >= canvas.width || bullet.y <= 0 || bullet.y >= canvas.height) {
        createExplosion(bullet.x, bullet.y);
        bullets.splice(bullets.indexOf(bullet), 1);
    }
}


function createExplosion(x, y) {
    const explosionRadius = 50; // Radius of the explosion

    // Damage nearby enemies
    enemies.forEach((enemy, index) => {
        const dist = Math.hypot(x - enemy.x, y - enemy.y);
        if (dist < explosionRadius) {
            enemy.health -= 20; // Damage dealt by explosion
            if (enemy.health <= 0) {
                enemies.splice(index, 1);
                score += player.doubleScore ? 20 : 10; 
            }
        }
    });

    // Create visual explosion effect
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 2 + 1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: Math.random() * 3 + 1
        });
    }
    explosions.push(particles);
}


function drawExplosions() {
    explosions.forEach(particles => {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Update particle position and alpha
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.02;

            // Remove particle if alpha is less than or equal to 0
            if (particle.alpha <= 0) {
                particles.splice(particles.indexOf(particle), 1);
            }
        });
    });

    // Remove explosion if no particles are left
    explosions = explosions.filter(particles => particles.length > 0);
}



function createFireball(x, y, direction) {
    const bullet = { x, y, direction, type: 'fireball', burn: true, stationaryTime: 0 };
    bullets.push(bullet);
}


function updateFireball(fireball) {
    moveBullet(fireball);

    // Apply burn effect to enemies in proximity
    enemies.forEach((enemy) => {
        const dist = Math.hypot(fireball.x - enemy.x, fireball.y - enemy.y);
        if (dist < enemy.radius + bulletRadius && fireball.burn) {
            enemy.burnDuration = 3000; // Burn duration in milliseconds
            enemy.burnDamage = 1; // Damage per burn tick
        }
    });
}

function applyMagnetEffect() {
    if (player.magnet) {
        const magnetRadius = 100;
        [...weapons, ...powerUps].forEach(item => {
            const dist = Math.hypot(player.x - item.x, player.y - item.y);
            if (dist < magnetRadius) {
                const angle = Math.atan2(player.y - item.y, player.x - item.x);
                item.x += Math.cos(angle) * 2; // Adjust speed as needed
                item.y += Math.sin(angle) * 2;
            }
        });
    }
}


function drawFireball(fireball) {
    ctx.beginPath();
    ctx.arc(fireball.x, fireball.y, bulletRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'orange';
    ctx.fill();
    ctx.closePath();
}

function createLightningBolt(x, y, direction) {
    const bullet = { x, y, direction, type: 'lightning', chain: true, stationaryTime: 0  };
    bullets.push(bullet);
}


function drawLightningBolt(lightningBolt) {
    ctx.beginPath();
    ctx.arc(lightningBolt.x, lightningBolt.y, bulletRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.closePath();
}


function updateLightningBolt(lightningBolt) {
    moveBullet(lightningBolt);

    // Apply chain effect to nearby enemies
    enemies.forEach((enemy) => {
        const dist = Math.hypot(lightningBolt.x - enemy.x, lightningBolt.y - enemy.y);
        if (dist < enemy.radius + bulletRadius && lightningBolt.chain) {
            enemy.chainDuration = 1000; // Chain effect duration in milliseconds
            enemy.chainDamage = 10; // Damage per chain hit

            // Find other nearby enemies to chain the effect
            const chainRadius = 250; // Increase chain effect radius
            const nearbyEnemies = enemies.filter(e => e !== enemy && Math.hypot(e.x - enemy.x, e.y - enemy.y) < chainRadius);
            nearbyEnemies.forEach((nearbyEnemy) => {
                nearbyEnemy.chainDuration = 1000;
                nearbyEnemy.chainDamage = 10;
                nearbyEnemy.chainedFrom = { x: enemy.x, y: enemy.y }; // Store the source enemy position for visual chaining
            });
        }
    });
}

function drawChainEffect() {
    enemies.forEach((enemy) => {
        if (enemy.chainedFrom) {
            ctx.beginPath();
            ctx.moveTo(enemy.chainedFrom.x, enemy.chainedFrom.y);
            ctx.lineTo(enemy.x, enemy.y);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    });
}


function createBouncingBullet(x, y, direction) {
    const bullet = { x, y, direction, type: 'bouncing', bounces: 3, stationaryTime: 0  };
    bullets.push(bullet);
}

function createHomingMissile(x, y) {
    const bullet = { x, y, type: 'homing', target: findNearestEnemy(x, y), stationaryTime: 0  };
    bullets.push(bullet);
}

function createLaserBeam(x, y, direction) {
    const beam = { x, y, direction, type: 'laser', duration: 500, stationaryTime: 0  };
    bullets.push(beam);
}

const enemyAttributes = {
    basic: { speed: 1, health: 50, damage: 10 },
    fast: { speed: 1.5, health: 30, damage: 5 },
    slow: { speed: 0.5, health: 70, damage: 15 },
    zigzag: { speed: 1, health: 50, damage: 10 },
    large: { speed: 0.75, health: 100, damage: 20 },
    ranged: { speed: 1, health: 50, damage: 10 },
    teleporting: { speed: 1, health: 60, damage: 10, teleportInterval: 2000 },
    splitting: { speed: 1, health: 40, damage: 10 } // Splitting enemy attributes

};


const enemySpawnWeights = {
    basic: 40,
    fast: 20,
    slow: 20,
    zigzag: 10,
    large: 5,
    ranged: 10,
    teleporting: 5,
    splitting: 5
};


function getWeightedRandomEnemyType() {
    const totalWeight = Object.values(enemySpawnWeights).reduce((sum, weight) => sum + weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const [type, weight] of Object.entries(enemySpawnWeights)) {
        if (randomWeight < weight) {
            return type;
        }
        randomWeight -= weight;
    }
}


function createEnemy(type = null, x = null, y = null, radius = enemyRadius, health = null) {
    type = type || getWeightedRandomEnemyType();
    
    do {
        x = x || Math.random() * (canvas.width - 2 * radius) + radius;
        y = y || Math.random() * (canvas.height - 2 * radius) + radius;
    } while (Math.hypot(player.x - x, player.y - y) < 100);

    const { speed, damage } = enemyAttributes[type];
    health = health || enemyAttributes[type].health;
    const enemy = { x, y, type, speed, radius, damage, health, maxHealth: health };
    enemies.push(enemy);

    if (type === 'ranged') {
        enemy.shootInterval = setInterval(() => {
            if (!gameOver && enemyInBounds(enemy) && enemyInArray(enemy)) {
                shootEnemyBullet(enemy.x, enemy.y);
            }
        }, 2000);
    }

    if (type === 'teleporting') {
        enemy.teleportInterval = setInterval(() => {
            if (!gameOver && enemyInArray(enemy)) {
                teleportEnemy(enemy);
            }
        }, enemyAttributes[type].teleportInterval);
    }
}


function shootEnemyBullet(x, y) {
    const angle = Math.atan2(player.y - y, player.x - x);
    const bullet = {
        x: x,
        y: y,
        vx: Math.cos(angle) * enemyBulletSpeed,
        vy: Math.sin(angle) * enemyBulletSpeed
    };
    enemyBullets.push(bullet);
}


function teleportEnemy(enemy) {
    let x, y;
    do {
        x = Math.random() * (canvas.width - 2 * enemy.radius) + enemy.radius;
        y = Math.random() * (canvas.height - 2 * enemy.radius) + enemy.radius;
    } while (Math.hypot(player.x - x, player.y - y) < 100);
    enemy.x = x;
    enemy.y = y;
}

function updateEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Remove bullets that go off the screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    });
}


function enemyInBounds(enemy) {
    return enemy.x >= 0 && enemy.x <= canvas.width && enemy.y >= 0 && enemy.y <= canvas.height;
}

function enemyInArray(enemy) {
    return enemies.includes(enemy);
}

function updateEnemies() {
    enemies.forEach((enemy, enemyIndex) => {

        if (enemy.frozen) return; // Skip update if frozen


        let nextX = enemy.x;
        let nextY = enemy.y;
		
	if (enemy.burnDuration > 0) {
            applyBurnEffect(enemy);
        }

	 if (enemy.chainDuration > 0) {
            applyChainEffect(enemy);
        }

        if (enemy.type === 'zigzag') {
            enemy.zigzagCount = (enemy.zigzagCount || 0) + 1;
            if (enemy.zigzagCount > 20) {
                enemy.zigzagDirectionX = Math.random() < 0.5 ? -1 : 1;
                enemy.zigzagDirectionY = Math.random() < 0.5 ? -1 : 1;
                enemy.zigzagCount = 0;
            }
            nextX += enemy.speed * enemy.zigzagDirectionX;
            nextY += enemy.speed * enemy.zigzagDirectionY;
        } else if (enemy.type !== 'ranged' && enemy.type !== 'teleporting' && !player.invisible) {
            if (enemy.x < player.x) nextX += enemy.speed;
            if (enemy.x > player.x) nextX -= enemy.speed;
            if (enemy.y < player.y) nextY += enemy.speed;
            if (enemy.y > player.y) nextY -= enemy.speed;
        }

        if (nextX < 0) nextX = canvas.width;
        if (nextX > canvas.width) nextX = 0;
        if (nextY < 0) nextY = canvas.height;
        if (nextY > canvas.height) nextY = 0;

        enemy.x = nextX;
        enemy.y = nextY;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        switch (enemy.type) {
            case 'basic':
                ctx.drawImage(basicEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'fast':
                ctx.drawImage(fastEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'slow':
                ctx.drawImage(slowEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'zigzag':
                ctx.drawImage(zigzagEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'large':
                ctx.drawImage(largeEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'ranged':
                ctx.drawImage(rangedEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'teleporting':
                ctx.drawImage(teleportingEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            case 'splitting':
                ctx.drawImage(splittingEnemyImg, -enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
                break;
            }
        ctx.restore();

        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, (enemy.radius * 2) * (enemy.health / enemy.maxHealth), 5);
    });
}

function drawWeapons() {
    weapons.forEach(weapon => {
        ctx.save();
        ctx.translate(weapon.x, weapon.y);
        switch (weapon.type) {
            case 'rapid':
                ctx.drawImage(rapidWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'spread':
                ctx.drawImage(spreadWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'double':
                ctx.drawImage(doubleWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'triple':
                ctx.drawImage(tripleWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'quad':
                ctx.drawImage(quadWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'diagonal':
                ctx.drawImage(diagonalWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'backward':
                ctx.drawImage(backwardWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
            case 'bomber':
                ctx.drawImage(bomberWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
	case 'fireball':
            ctx.drawImage(fireballWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
        case 'lightning':
            ctx.drawImage(lightningWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
        case 'bouncing':
            ctx.drawImage(bouncingWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
        case 'homing':
            ctx.drawImage(homingWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;
        case 'laser':
            ctx.drawImage(laserWeaponImg, -weapon.radius, -weapon.radius, weapon.radius * 2, weapon.radius * 2);
                break;

        }
        ctx.restore();
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        switch (powerUp.type) {
            case 'shield':
                ctx.drawImage(shieldPowerUpImg, -powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'speedBoost':
                ctx.drawImage(speedBoostPowerUpImg, -powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'healthRestore':
                ctx.drawImage(healthRestorePowerUpImg, -powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'invisibilityCloak':
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(-powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'magnet':
                ctx.fillStyle = 'rgba(192, 192, 192, 0.5)';
                ctx.fillRect(-powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'timeFreeze':
                ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
                ctx.fillRect(-powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
            case 'doubleScore':
                ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.fillRect(-powerUp.radius, -powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
                break;
        }
        ctx.restore();
    });
}

function drawHazards() {
    hazards.forEach(hazard => {
        ctx.save();
        ctx.translate(hazard.x, hazard.y);
        ctx.drawImage(hazardImg, -hazard.radius, -hazard.radius, hazard.radius * 2, hazard.radius * 2);
        ctx.restore();
    });
}

function getWeaponColor(type) {
    switch (type) {
        case 'rapid':
            return 'purple';
        case 'spread':
            return 'orange';
        case 'double':
            return 'blue';
        case 'triple':
            return 'red';
        case 'quad':
            return 'green';
        case 'diagonal':
            return 'yellow';
        case 'backward':
            return 'pink';
        case 'bomber':
            return 'brown';
        case 'fireball':
            return 'orange';
        case 'lightning':
            return 'yellow';
        case 'bouncing':
            return 'blue';
        case 'homing':
            return 'green';
        case 'laser':
            return 'red';
        default:
            return 'cyan';
    }
}

function createExplosion(x, y) {
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 2 + 1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: Math.random() * 3 + 1
        });
    }
    explosions.push(particles);
}

function updateExplosions() {
    explosions.forEach((particles, index) => {
        particles.forEach((particle, i) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.02;
            if (particle.alpha <= 0) {
                particles.splice(i, 1);
            }
        });
        if (particles.length === 0) {
            explosions.splice(index, 1);
        }
    });
}

function drawExplosions() {
    explosions.forEach(particles => {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

function updateWeaponInfo() {
    weaponTextDiv.innerText = `Weapon: ${player.weapon}`;
    weaponIconDiv.style.backgroundImage = `url(${getWeaponIcon(player.weapon)})`;
}

function getWeaponIcon(type) {
    switch (type) {
        case 'rapid':
            return 'rapid_weapon.png';
        case 'spread':
            return 'spread_weapon.png';
        case 'double':
            return 'double_weapon.png';
        case 'triple':
            return 'triple_weapon.png';
        case 'quad':
            return 'quad_weapon.png';
        case 'diagonal':
            return 'diagonal_weapon.png';
        case 'backward':
            return 'backward_weapon.png';
        case 'bomber':
            return 'bomber_weapon.png';
        case 'fireball':
            return 'fireball_weapon.png';
        case 'lightning':
            return 'lightning_weapon.png';
        case 'bouncing':
            return 'bouncing_weapon.png';
        case 'homing':
            return 'homing_weapon.png';
        case 'laser':
            return 'laser_weapon.png';
        default:
            return 'normal_weapon.png';
    }
}

function updateWeaponTimer() {
    if (player.weapon !== 'normal') {
        weaponTimerText.innerText = `Weapon Time: ${(player.weaponDuration / 1000).toFixed(1)}s`;
    } else {
        weaponTimerText.innerText = '';
    }
}

function updateScores() {
    currentScoreText.innerText = `Current Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    highScoreText.innerText = `High Score: ${highScore}`;
}

function updateDifficultyLevel() {
    difficultyLevelText.innerText = `Difficulty Level: ${difficulty}`;
}

function increaseDifficulty() {
    if (score > level * 100) {
        level++;
        difficulty++;
        enemySpawnInterval = Math.max(500, enemySpawnInterval - 200);
        clearInterval(enemySpawnIntervalID);
        enemySpawnIntervalID = setInterval(createEnemy, enemySpawnInterval);
        showLevelUpMessage();
    }
}

function showLevelUpMessage() {
    const levelUpMessage = document.createElement('div');
    levelUpMessage.innerText = `Level ${level}!`;
    levelUpMessage.style.position = 'absolute';
    levelUpMessage.style.top = '50%';
    levelUpMessage.style.left = '50%';
    levelUpMessage.style.transform = 'translate(-50%, -50%)';
    levelUpMessage.style.color = 'white';
    levelUpMessage.style.fontSize = '48px';
    levelUpMessage.style.fontWeight = 'bold';
    levelUpMessage.style.zIndex = '10';
    document.body.appendChild(levelUpMessage);
    
    setTimeout(() => {
        document.body.removeChild(levelUpMessage);
    }, 2000);
}

// Initialize game
enemySpawnIntervalID = setInterval(createEnemy, enemySpawnInterval);
setInterval(createWeapon, 10000);  // Spawn a weapon every 10 seconds
setInterval(createPowerUp, 15000);
setInterval(createHazard, 12000);
gameLoop();
