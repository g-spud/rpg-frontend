//function for deep cloning an object, creating new arrays and functions
function deepClone (obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
  
    if (Array.isArray(obj)) {
        return obj.map(deepClone); // Recursively clone each array element
    }
  
    const clonedObj = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]); // Recursively clone each property
        }
    }
    return clonedObj;
}

//html container that holds the entire game display
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");

//prep background
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Raindrop {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.length = Math.random() * 20 + 15;
        this.speed = Math.random() * 4 + 10;
        this.opacity = Math.random() * 0.34 + 0.66;
    }
    fall() {
        this.y += this.speed;
        if (this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(173, 216, 230, ${this.opacity})`; // light blue
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}

class Cloud {
    constructor() {
        this.reset(true);
    }   
    reset(initial = false) {
        this.x = initial ? Math.random() * canvas.width : -300;
        this.y = Math.random() * (canvas.height / 2); // top half of screen
        this.speed = Math.random() * 0.125;
        this.size = Math.random() * 50 + 50;
        this.puffs = this.generatePuffs();
    }   
    update() {
        this.x += this.speed;
        if (this.x - this.size > canvas.width) {
            this.reset();
        }
    }   
    draw() {
        // Draw fluffy cloud using arcs;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();

        this.puffs.forEach(puff => {
            ctx.moveTo(this.x + puff.offsetX + puff.radius, this.y + puff.offsetY);
            ctx.arc(this.x + puff.offsetX, this.y + puff.offsetY, puff.radius, 0, Math.PI * 2);
        });

        ctx.fill();
    }
    generatePuffs() {
        const puffCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 puffs
        const puffs = [];

        for (let i = 0; i < puffCount; i++) {
            const offsetX = i * (this.size / 2); // space puffs horizontally
            const offsetY = Math.random() * -this.size / 4; // slight vertical variation
            const radius = this.size / 3 + Math.random() * this.size / 3;
            puffs.push({ offsetX, offsetY, radius });
        }

        return puffs;
    }
}

function drawSky() {
    // Simple gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0.0, "#4da6ff");   // Dark blue at top
    gradient.addColorStop(0.10, "#7ccae9");   // sky blue stays until
    gradient.addColorStop(0.3, "#a8dcf0");   // Lighter sky blue
    gradient.addColorStop(1, "#ffffff");   // White near bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Create setpieces
const raindrops = Array.from({ length: 250 }, () => new Raindrop());
const clouds = Array.from({ length: 10 }, () => new Cloud());
const animate = {
    init: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    rain: function () {
        raindrops.forEach(drop => {
          drop.fall();
          drop.draw();
        });
        requestAnimationFrame(animate.rain);
    },
    sunny: function () {
        drawSky();
        clouds.forEach(cloud => {
          cloud.update();
          cloud.draw();
        });
        requestAnimationFrame(animate.sunny);
    }
}

animate.init();
animate.sunny();
//animate.rain();

//variables for battle interface html elements assigned when combat initiates
let statAlly;
let statEnemy;
let interfaceContainer;
let statusContainer;
let statusContents;
let resultContainer;
let conContainer;
let dialogueContents;
let dialogueTarget;
let currentConvo;
let currentTopic;
let menuBattle;
let column1;
let column2;
let column3;

//counter for unique IDs
let countUnique = 0;
let countMessage = 0;
let countModifier = 0;

//arrays for individual things that exist
let everything = [];
let characters = [];
let weapons = [];
let armours = [];
let accessorys = [];
let items = [];
let skills = [];
const elements = ['phys', 'mind', 'fire', 'water', 'earth', 'air', 'ice', 'elec', 'light', 'dark'];

//counters and arrays for tracking combat info, participants, history etc
let round = 0; //tracks rounds
let turn = 0; //tracks turn count within a round
let combatHistory = []; //log of events in current combat
let activeChar; //current char taking turn
let actionSelected; //used to determine when to show action info on mouseover
let actionTypeSelected; //used to determine when to show action choices on mouseover
let examineSelected; //used to remember which character was last examined

let modifiers = []; //stores active modifiers
let currentEffs = [];
let ally = []; //array of allies in current combat
let enemy = []; //array of enemies in current combat
let messages = {
    priority: [],
    status: [],
    weather: '',
    celestial: '',
    global: [],
    char: [],
    con: [],
    announce: '',
    result: [],
    dialogue: [],
    choice: [],
    continue: `<button onclick="combatTurnEnd()"><u>Continue</u></button>`
};
function combat () {
    return [...ally, ...enemy];
}
function targetTeam (char, targetType, includeDead) {
    let team = [];
    if (char.team === 'ally') {
        if (targetType === 'enemy') {
            team = enemy;
        } else if (targetType === 'ally') {
            team = ally;
        }
    } else if (char.team === 'enemy') {
        if (targetType === 'enemy') {
            team = ally;
        } else if (targetType === 'ally') {
            team = enemy;
        }
    }
    switch (includeDead ?? undefined) {
        case undefined:
            team = team.filter(char => char.dead === false);
            break;
        case 'include':
            break;
        case 'only':
            team = team.filter(char => char.dead === true);
            break;
    }
    return team;
}
function replaceStat (stat, lCase) {
    output = {
        str: 'strength',
        agi: 'agility',
        for: 'fortitude',
        int: 'intellect',
        cha: 'charisma',
        wil: 'will',
        baseHp: 'max health',
        baseMp: 'max mana',
        initiative: 'initiative',
        critMultiplier: 'crit damage',
        accuracy: 'accuracy',
        damage: 'damage',
        critChance: 'crit chance',
        dodge: 'dodge',
        accuracyM: 'accuracy mult',
        critChanceM: 'crit chance mult',
        dodgeM: 'dodge mult',
        defence: 'defence',
        defenceM: 'defence mult',
        critMultiplierM: 'crit damage mult',
        damageM: 'damage mult',
        healSelfM: 'healing',
        healTargetM: 'heal power'
    };
    let str = output[stat];
    if (!lCase) {
        str = str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
}
function replaceElement (element, lCase) {
    let output;
    if (lCase) {
        output = {
            phys: 'physical',
            mind: 'mind',
            fire: 'fire',
            water: 'water',
            earth: 'earth',
            air: 'air',
            ice: 'ice',
            elec: 'electric',
            light: 'light',
            dark: 'dark',
        };  
    } else {
        output = {
            phys: 'Physical',
            mind: 'Mind',
            fire: 'Fire',
            water: 'Water',
            earth: 'Earth',
            air: 'Air',
            ice: 'Ice',
            elec: 'Electric',
            light: 'Light',
            dark: 'Dark',
        };
    }
    return output[element];
}
function replaceCriteria (criteria) {
    if (elements.includes(criteria)) {
        return replaceElement(criteria);
    }
    const output = {
        attack: 'Attack',
        attackT: 'Attacked',
        attackSuccess: 'Attack hit',
        attackSuccessT: 'Hit by attack',
        weapon: 'Weapon',
        weaponSkill: 'Weapon skill',
        magicMat: 'Magic (Material)',
        magicMen: 'Magic (Mental)',
        magic: 'Magic',
        social: 'Social',
        ranged: 'Ranged',
        melee: 'Melee',
        unarmed: 'Unarmed',
        kick: 'Kick',
        heal: 'Heal',
        healT: 'Healed',
        instrument: 'Instrument'
    }
    return output[criteria];
}
function tooltipMod (mod) {
    if (mod.tooltip) {
        return mod.tooltip;
    }
    desc = '';
    if (mod.eff) {
        const eWE = mod.eff.find(e => e.weaponElement);
        const eWeak = mod.eff.find(e => e.weak);
        const eResist = mod.eff.find(e => e.resist);
        const eImmune = mod.eff.find(e => e.immune);
        if (eWE || eWeak || eResist || eImmune) {
            if (eWE) {
                desc += `Weapon deals ${replaceElement(eWE.weaponElement, true)} damage<br>`
            }
            if (eWeak) {
                const weakMap = eWeak.weak.map(element => replaceElement(element, true));
                desc += `Weak to ${weakMap.join(', ')}<br>`;
            }
            if (eResist) {
                const resistMap = eResist.resist.map(element => replaceElement(element, true));
                desc += `Resist ${resistMap.join(', ')}<br>`;
            }
            if (eImmune) {
                const immuneMap = eImmune.immune.map(element => replaceElement(element, true));
                desc += `Immune to ${immuneMap.join(', ')}<br>`;
            }
        }
        const eStat = mod.eff.filter(eff  => eff.stat);
        if (eStat.length) {
            const descEffMap = eStat.map(e => `${descEff(e, true)}; `);
            desc += `${descEffMap.join('')}`;
        }
    }
    for (let i = 0; i < mod.triggerEff?.length; ++i) {
        const triggerEff = mod.triggerEff[i];
        console.log(`tooltipMod is describing ${mod.id} triggerEff[${i}]:`);
        console.log(deepClone(triggerEff));
        if (triggerEff.eff) {
            const descTrigger = triggerEff.trigger.map(trigger => replaceCriteria(trigger));
            desc += `<u>Trigger</u>: ${descTrigger.join('/ ')}; `;
            if (triggerEff.category) {
                const descCat = triggerEff.category.map(triggerEff => replaceCriteria(triggerEff));
                desc += `<u>Criteria</u>: ${descCat.join('/ ')}; `;
            }
            if (triggerEff.category2) {
                const descCat = triggerEff.category2.map(triggerEff => replaceCriteria(triggerEff));
                desc += `<u>Criteria 2</u>: ${descCat.join('/ ')}; `;
            }
            desc += `<br>`;
            const eWE = triggerEff.eff.find(e => e.weaponElement);
            const eWeak = triggerEff.eff.find(e => e.weak);
            const eResist = triggerEff.eff.find(e => e.resist);
            const eImmune = triggerEff.eff.find(e => e.immune);
            if (eWE || eWeak || eResist || eImmune) {
                if (eWE) {
                    desc += `Weapon deals ${replaceElement(eWE.weaponElement, true)} damage; `
                }
                if (eWeak) {
                    const weakMap = eWeak.weak.map(element => replaceElement(element, true));
                    desc += `Weak to ${weakMap.join(', ')}; `;
                }
                if (eResist) {
                    const resistMap = eResist.resist.map(element => replaceElement(element, true));
                    desc += `Resist ${resistMap.join(', ')}; `;
                }
                if (eImmune) {
                    const immuneMap = eImmune.immune.map(element => replaceElement(element, true));
                    desc += `Immune to ${immuneMap.join(', ')}; `;
                }
            }
            const eStat = triggerEff.eff.filter(eff => eff.stat);
            if (eStat.length) {
                const descEffMap = eStat.map(e => descEff(e, true));
                desc += `${descEffMap.join('; ')}; `;
            }
        }
        desc += '<br>';
    }
    if (mod.tooltipEnd) {
        desc += mod.tooltipEnd;
    }
    return desc;
}
function describeMod (mod) {
    let seg;
    let segArray = [];
    if (mod.descAction) {
        segArray.push(`<div>${mod.descAction}</div>`);
    }
    if (mod.eff) {
        const eWE = mod.eff.find(e => e.weaponElement);
        const eWeak = mod.eff.find(e => e.weak);
        const eResist = mod.eff.find(e => e.resist);
        const eImmune = mod.eff.find(e => e.immune);
        if (eWE || eWeak || eResist || eImmune) {
            let seg = '<div>';
            let subArray = [];
            if (eWE) {
                subArray.push(`Weapons and weapon skills deal ${replaceElement(eWE.weaponElement, true)} damage.`);
            }
            if (eWeak) {
                const weakMap = eWeak.weak.map(element => replaceElement(element, true));
                subArray.push(`Weak to ${weakMap.join(', ')}`);
            }
            if (eResist) {
                const resistMap = eResist.resist.map(element => replaceElement(element, true));
                subArray.push(`Resist ${resistMap.join(', ')}`);
            }
            if (eImmune) {
                const immuneMap = eImmune.immune.map(element => replaceElement(element, true));
                subArray.push(`Immune to ${immuneMap.join(', ')}`);
            }
            seg += `${subArray.join('<br>')}`;
            seg += '</div>';
            segArray.push(seg);
        }
        const eStat = mod.eff.filter(eff  => eff.stat);
        if (eStat.length) {
            const descEffMap = eStat.map(e => descEff(e));
            segArray.push(`<div class="battle-infotable">${descEffMap.join('')}</div>`);
        }
    }
    if (mod.triggerEff?.some(eff => eff.eff || eff.descAction)) {
        seg = '<div>';
        if (mod.triggerEff?.length === 1) {
            seg += `<span class="menu-battle-small"><b>Triggered Effect</b></span>`;
        } else if (mod.triggerEff?.length > 1) {
            seg += `<span class="menu-battle-small"><b>Triggered Effects</b></span>`;
        }
        for (let i = 0; i < mod.triggerEff?.length; ++i) {
            seg += `<div>`;
            const triggerEff = mod.triggerEff[i];
            console.log(`describeMod is describing ${mod.id} triggerEff[${i}]:`);
            console.log(deepClone(triggerEff));
            if (triggerEff.eff || triggerEff.descAction) {
                const descTrigger = triggerEff.trigger.map(trigger => replaceCriteria(trigger));
                seg += `<u>Trigger</u>: ${descTrigger.join(', ')}`;
                if (triggerEff.category) {
                    descCat = triggerEff.category.map(triggerEff => replaceCriteria(triggerEff));
                    seg += `<br><u>Criteria</u>: ${descCat.join(', ')}`;
                }
                if (triggerEff.category2) {
                    descCat = triggerEff.category2.map(triggerEff => replaceCriteria(triggerEff));
                    seg += `<br><u>Secondary criteria</u>: ${descCat.join(', ')}`;
                }
                seg += '<br>';
                const eWE = triggerEff.eff.find(e => e.weaponElement);
                const eWeak = triggerEff.eff.find(e => e.weak);
                const eResist = triggerEff.eff.find(e => e.resist);
                const eImmune = triggerEff.eff.find(e => e.immune);
                if (eWE || eWeak || eResist || eImmune) {
                    seg += `<div>`;
                    if (eWE) {
                        seg += `Weapons and weapon skills deal ${replaceElement(eWE.weaponElement, true)} damage.`;
                    }
                    if (eWeak) {
                        const weakMap = eWeak.weak.map(element => replaceElement(element, true));
                        seg += `Weak to ${weakMap.join(', ')}`;
                    }
                    if (eResist) {
                        const resistMap = eResist.resist.map(element => replaceElement(element, true));
                        seg += `Resist ${resistMap.join(', ')}`;
                    }
                    if (eImmune) {
                        const immuneMap = eImmune.immune.map(element => replaceElement(element, true));
                        seg += `Immune to ${immuneMap.join(', ')}`;
                    }
                    seg += `</div>`;
                }
                const eStat = triggerEff.eff.filter(eff => eff.stat);
                if (eStat) {
                    const descEffMap = eStat.map(e => descEff(e));
                    seg += `<div class="battle-infotable" style="margin-top: 10px;">${descEffMap.join('')}</div>`;
                }
                if (triggerEff.descAction) {
                    seg += `${triggerEff.descAction}`;
                }
            }
            seg += `<br></div>`;
        }
        seg += `</div>`;
        segArray.push(seg);
    } 
    return segArray;
}
function descEff (eff, tooltip) {
    let descEff = '';

    if (!tooltip) {
        descEff += `<div class="battle-infocell"><span class="menu-battle-small"><b>${replaceStat(eff.stat)}</b></span><br>`;
    } else {
        descEff += `<span class="tt-block"><b>${replaceStat(eff.stat)}:</b> `;
    }

    if (eff.val && eff.multi) {
        if (eff.val > 0) {
            descEff += ` +${eff.val}, x ${eff.multi}`;
        } else if (eff.val < 0) {
            descEff += ` ${eff.val}, x ${eff.multi}`;
        }
    } else if (eff.val) {
        if (eff.val > 0) {
            descEff += ` +${eff.val}`;
        } else if (eff.val < 0) {
            descEff += ` ${eff.val}`;
        }
    } else if (eff.multi) {
        descEff += ` x ${eff.multi}`;
    }

    if (!tooltip) {
        descEff += `</div>`;
    } else {
        descEff += `</span>`;
    }
    return descEff;
}
function descTarget (action) {
    let seg = '';
    switch (action.selectTarget) { 
        case 'enemySingle':
            seg = 'Targets one enemy.';
            break;
        case 'enemyTeam':
            seg = 'Targets all enemies.';
            break;
        case 'enemyRandom':
            if (action.randomNumber || action.randomMin) {
                if (action.randomNumber) {
                    seg = `Targets ${action.randomNumber} enemies at random.`;
                } else if (action.randomMin) {
                    seg = `Targets ${action.randomMin} to ${action.randomMax} enemies at random.`;
                }
                if (action.targetRepeat) {
                    seg += `<br>Can target an enemy multiple times.`;
                }
            } else {
                seg = `Targets one random enemy.`
            }
            break;
        case 'allySingle':
            seg = `Targets one ally.`;
            if (action.selectOther) {
                seg += `<br>Cannot target the user.`;
            }
            break;
        case 'allyTeam':
            seg = `Targets all allies.`;
            if (action.selectOther) {
                descTarget += `<br>Does not include the user.`;
            }
            break;
        case 'allyRandom':
            if (action.randomNumber || action.randomMin) {
                if (action.randomNumber) {
                    seg = `Targets ${action.randomNumber} allies at random.`;
                } else if (action.randomMin) {
                    seg = `Targets ${action.randomMin} to ${action.randomMax} allies at random.`;
                }
                if (action.targetRepeat) {
                    seg += `<br>Can target an ally multiple times.`;
                }
            } else {
                seg = `Targets one random ally.`
            }
            if (action.selectOther) {
                seg += `<br>Cannot target the user.`;
            }
            break;
        case 'anyone':
            if (action.selectOther) {
                seg = `Targets anyone except the user.`;
            } else {
                seg = `Targets anyone.`;
            }
            break;
        case 'everyone':
            if (action.selectOther) {
                seg = `Targets everyone except the user.`;
            } else {
                seg = `Targets everyone.`;
            }
            break;
        case 'yourself':
            seg = `Targets the user.`;
            break;
    }
    return seg;
}
function descMenu (action, c) {
    const act = action.action[0];
    let segArray = [];
    seg = `
    <div class="menu-battle-big"><b>${action.name}</b></div>
    <span>${action.descMenu}</span>`;
    segArray.push(seg);
    switch (act.actFn) {
        case 'attack':
            seg = '';
            if (action.thingType === 'weapon' || act.category.includes('weaponSkill')) {
                seg += `<span class="menu-battle-big"><b>Weapon Attack (${replaceElement(act.element)})</b></span>`;
            } else {
                seg += `<span class="menu-battle-big"><b>Attack (${replaceElement(act.element)})</b></span>`;
            }
            if (act.category.includes('weaponSkill')) {
                seg += `<span>This skill counts as a <b>weapon attack</b>.</span>`;
            }
            seg += `<span>${descTarget(action)}</span>`;
            segArray.push(seg);

            seg = `
            <div class="battle-infotable">
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Accuracy</b></span>
                        <br><span class="menu-battle-small"><b>${act.accuracy}%</b></span>
                        <br>${replaceStat(act.statAcc)}
                    </span>
                </div>`;
            if (c) {
                seg += `
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Damage</b></span>
                        <br><span class="menu-battle-small"><b>${act.damage + (Math.floor((act.damageP/100) * c[act.statDam] + 0.5))}</b></span>
                        <br>${act.damage} +${act.damageP}% of ${replaceStat(act.statAcc)}
                    </span>
                </div>`;
            } else {
                seg += `
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Damage</b></span>
                        <br><br><span class="menu-battle-small"><b>${act.damage}</b></span>
                        <br>+${act.damageP}% of ${replaceStat(act.statAcc)}
                    </span>
                </div>`;
            }
            seg += `
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Critical Hit</b></span>
                        <br><b>${act.critChance}%</b> chance
                        <br><b>x ${act.critMultiplier}</b> damage
                    </span>
                </div>
            </div>
            `;
            segArray.push(seg);
            seg= `
            <div class="battle-infotable">
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Dodged by</b></span>
                        <br>${replaceStat(act.statDodge)}
                    </span>
                </div>
                <div class="battle-infocell">
                    <span>
                        <span class="menu-battle-medium"><b>Defended by</b></span>
                        <br>${replaceStat(act.statDef)}
                    </span>
                </div>
            </div>
            `;
            segArray.push(seg);
            seg = `Inflicts ${act.conDamage} ${replaceElement(act.element, true)} condition damage.`
            segArray.push(seg);
            break;
        case 'heal':
            seg = `<span><span class="menu-battle-big"><b>Heal</b></span>`;
            seg += `<br>${descTarget(action)}</span>`;
            segArray.push(seg);
            if (act.heal && act.healP) {
                seg = `<span class="menu-battle-small">Heals <b>${Math.floor(act.heal + (c[act.statHeal] * act.healP / 100))}</b> health.</span>
                <span>${act.heal} + ${Math.floor(c[act.statHeal] * act.healP / 100)} (${act.healP}% of ${replaceStat(act.statHeal)})</span>`;
                if (act.healMaxHp) {
                    seg += `<span>Additionally heals <b>${act.healMaxHp}%</b> of target's maximum health.</span></span>`;
                } else {
                    seg += `</span>`;
                }
            } else if (act.heal) {
                seg = `<span><span class="menu-battle-small">Heals <b>${act.heal}</b> health.<span>`;
                if (act.healMaxHp) {
                    seg += `<span>Additionally heals <b>${act.healMaxHp}%</b> of target's maximum health.</span></span>`;
                } else {
                    seg += `</span>`;
                }
            } else if (act.healP) {
                seg = `<span><span class="menu-battle-small">Heals <b>${Math.floor(c[act.statHeal] * act.healP / 100)}</b> health.</span>
                <br><span>(${act.healP}% of ${replaceStat(act.statHeal)})</span>`;
                if (act.healMaxHp) {
                    seg += `<span>Additionally heals <b>${act.healMaxHp}%</b> of target's maximum health.</span></span>`;
                } else {
                    seg += `</span>`;
                }
            } else if (act.healMaxHp) {
                seg = `<span class="menu-battle-small">Heals <b>${act.healMaxHp}%</b> of target's maximum health.</span>`;
            }
            if (act.conHeal && act.conHealElement) {
                seg += `<span><br>Recovers ${act.conHeal} ${replaceElement(act.conHealElement, true)} condition.</span>`;
            } else if (act.conHeal) {
                seg += `<span><br>Recovers ${act.conHeal} from all element conditions.</span>`;
            }
            segArray.push(seg);
            break;
        case 'modify':
            const mod = act.modifier;
            seg = `<div>`;
            if (mod.descriptor) {
                seg += `<span class="menu-battle-big"><b>Modifier (${mod.descriptor})</b></span>`;
            } else {
                seg += `<span class="menu-battle-big"><b>Modifier</b></span>`;
            }
            seg += `<br><span>${descTarget(action)}</span>`;
            if (mod.expCount) {
                seg += `<br><span>Expires in ${mod.expCount} `;
                switch (mod.expTime) {
                    case 'tTurnStart':
                        seg += `turns (start of target's turn).`;
                        break;
                    case 'cTurnStart':
                        seg += `turns (start of user's turn).`;
                        break;
                    case 'tTurnEnd':
                        seg += `turns (end of target's turn).`;
                        break;
                    case 'cTurnEnd':
                        seg += `turns (end of user's turn).`;
                        break;
                    case 'roundStart':
                        seg += `rounds (start of round).`;
                        break;
                    default:
                        throw new Error(`${mod.expTime} not found!`);
                }
                seg += `</span>`;
            }
            if (mod.exhaustCount) {
                seg += `<br><span>`;
                if (mod.exhaustCount === 1) {
                    seg += `Expires after being triggered.`;
                } else if (mod.exhaustCount > 1) {
                    seg += `Expires after being triggered ${mod.exhaustCount} times.`
                }
                seg += `</span>`;
            }
            if (mod.onePerC) {
                seg += `<br><span>`
                switch (mod.onePerC) {
                    case 'target':
                        seg += `<i>This character can only create one copy of this modifier per target.</i>`;
                        break;
                    case 'global':
                        seg += `<i>This character can only create one copy of this modifier.</i>`;
                        break;
                    case 'team':
                        seg += `<i>This character can only create one copy of this modifier per team.</i>`;
                        break;
                }
                seg += `</span>`;
            }
            if (mod.onePerId) {
                seg += `<br><span>`
                switch (mod.onePerId) {
                    case 'target':
                        seg += `<i>Only one copy of this modifier can apply to each target.</i>`;
                        break;
                    case 'global':
                        seg += `<i>Only one copy of this modifier can exist.</i>`;
                        break;
                    case 'team':
                        seg += `<i>Only one copy of this modifier can exist per team.</i>`;
                        break;
                }
                seg += `</span>`;
            }
            seg += `</div>`;
            segArray.push(seg);
            if (describeMod(mod)) {
                segArray = [...segArray, ...describeMod(mod)]
            }
            break;
    }
    if (action.descAction) {
        segArray.push(`${action.descAction}`);
    } else if (action.action.length > 1) {
        segArray.push(`This action has additional effects.`);
    }
    return segArray.join(`<br>`);
}
function hoverTarget (targetList) {
    targetList.forEach(target => {
        target.statbox.name.div.innerHTML = `<u>${target.name}</u>`;
        const charbox = target.statbox.div;
        if (target.team === 'enemy') {
            charbox.classList.add('drop');
        } else if (target.team === 'ally') {
            charbox.classList.add('pop');
        }
    });
}
function leaveTarget () {
    updateStatbox();
    combat().forEach(target => {
        const charbox = target.statbox.div;
        if (target.team === 'enemy') {
            charbox.classList.remove('drop');
        } else if (target.team === 'ally') {
            charbox.classList.remove('pop');
        }
    });
}
function examineChar (target) {
    column3.innerHTML = `
    <div class="menu-battle-big"><strong><u>${target.name}</u></strong></div>
    <div>Sentiment: ${target.sentiment}
    <br>${target.name} is a ${target.man}.
    <br>${target.He} uses ${target.male} pronouns.</div>
    <div><br><span class="menu-battle-big"><b><u>${target.weapon.name}</u></b></span>
    <br>${target.weapon.descMenu}</div>`;

    if (target.armour.id !== 'noArmour') {
        column3.innerHTML +=`
        <div><br><span class="menu-battle-big"><b><u>${target.armour.name}</u></b></span>
        <br>${target.armour.descMenu}`;
        if (target.armour.mod.eff || target.armour.mod.triggerEff || target.armour.mod.descAction) {
            column3.innerHTML += `<br>${describeMod(target.armour.mod).join('<br>')}</div>`
        } else {
            column3.innerHTML += `</div>`;
        }
    }
    if (target.accessory.id !== 'noAccessory') {
        column3.innerHTML += `
        <div><br><span class="menu-battle-big"><b><u>${target.accessory.name}</u></b></span>
        <br>${target.accessory.descMenu}`;
        if (target.accessory.mod.eff || target.accessory.mod.triggerEff || target.accessory.mod.descAction) {
            column3.innerHTML += `<br>${describeMod(target.accessory.mod).join('<br>')}</div>`;
        } else {
            column3.innerHTML += `</div>`;
        }
    }
}
function resetSelection (c) {
    leaveTarget();
    if (actionSelected) {
        playerBattleMenu.selectAction(c, actionSelected);
    } else if (actionTypeSelected) {
        switch (actionTypeSelected) {
            case 'skills':
                playerBattleMenu.skillChoices(c); 
                break;
            case 'items':
                playerBattleMenu.itemChoices(c); 
                break;
            case 'talk':
                playerBattleMenu.talk(c);
                break;
            case 'examine':
                playerBattleMenu.examine(c, false, true);
                break;
        }
    } else {
        column2.innerHTML = '';
        charDesc(c);
    }
}
function charDesc (c) {
    //column3.innerHTML = `<div><span class="menu-battle-big"><b>${c.weapon.name}</b></span>
    //<br>${c.weapon.descMenu}</div>`;
    //if (c.armour.id !== 'noArmour') {
    //    column3.innerHTML +=`
    //    <div><br><span class="menu-battle-big"><b>${c.armour.name}</b></span>
    //    <br>${c.armour.descMenu}</div>`;
    //}
    //if (c.accessory.id !== 'noAccessory') {
    //    column3.innerHTML += `
    //    <div><br><span class="menu-battle-big"><b>${c.accessory.name}</b></span>
    //    <br>${c.accessory.descMenu}</div>`;
    //}
    column3.innerHTML = `
    <div><span class="menu-battle-big"><b>${c.weapon.name}</b></span>
    <br>${c.weapon.descMenu}</div>`;

    if (c.armour.id !== 'noArmour') {
        column3.innerHTML +=`
        <div><br><span class="menu-battle-big"><b>${c.armour.name}</b></span>
        <br>${c.armour.descMenu}`;
        if (c.armour.mod.eff || c.armour.mod.triggerEff || c.armour.mod.descAction) {
            column3.innerHTML += `<br>${describeMod(c.armour.mod).join('<br>')}</div>`
        } else {
            column3.innerHTML += `</div>`;
        }
    }
    if (c.accessory.id !== 'noAccessory') {
        column3.innerHTML += `
        <div><br><span class="menu-battle-big"><b>${c.accessory.name}</b></span>
        <br>${c.accessory.descMenu}`;
        if (c.accessory.mod.eff || c.accessory.mod.triggerEff || c.accessory.mod.descAction) {
            column3.innerHTML += `<br>${describeMod(c.accessory.mod).join('<br>')}</div>`;
        } else {
            column3.innerHTML += `</div>`;
        }
    }
}
const stringFn = {
    commaAnd: function (arr) {
        let output = '';
        for (let i = 0; i < arr.length; ++i) {
            output += `${arr[i]}`;
            if (i < arr.length - 2) {
                output += ', ';
            } else if (arr.length > 1 && i === arr.length - 2) {
                output += ` and `;
            }
        }
        return output;
    }
};
const htmlFn = {
    findSide: function (child, side) {
        if (child.style.display === 'none') throw new Error(`you're trying to find the side of a hidden child!`);
        switch (side) {
            case 'bottom':
                return child.offsetTop + child.offsetHeight;
            case 'top':
                return child.offsetTop;
            case 'left':
                return child.offsetLeft;
            case 'right':
                return child.offsetLeft + child.offsetWidth;
        }
    },
    findLastBottom: function (parent, className) {
        const children = parent.querySelectorAll(`.${className}`);
        let maxBottom = 0;

        for (let i = 0; i < children.length; ++i) {
            const child = children[i];
            if (child.style.display === 'none') continue;

            const bottom = child.offsetTop + child.offsetHeight;
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        }
        return maxBottom;
    },
    findPrevBottom: function (parent, className, currentDiv) {
        const allChildren = Array.from(parent.querySelectorAll(`.${className}`));
        const currentIndex = allChildren.findIndex(child => child.id === currentDiv.id);
        let maxBottom = 0;

        for (let i = 0; i < currentIndex; ++i) {
            const child = allChildren[i];
            if (child.style.display === 'none') continue;

            const bottom = child.offsetTop + child.offsetHeight;
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        }
        return maxBottom;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function printWithDelay(arr, delayTime, container) {
    for (let item of arr) {
        container.innerHTML += item;
        await delay(delayTime);
    }
}

class Thing {
    constructor (id, thingType) {
        countUnique += 1;
        this.uid = countUnique;
        this.id = id;
        this.thingType = thingType;
        everything.push(this);
    }
}

class CombatLog {
    constructor (context) {
        combatHistory.push(this);
        this.round = round;
        this.turn = turn;
        if (context.cUid) { this.cUid = context.cUid; }
        if (context.aId) { this.aId = context.aId; }
        if (context.aUid) { this.aUid = context.aUid; }
        if (context.actIndex !== undefined) { this.actIndex = context.actIndex; }
        if (context.tUid) { this.tUid = context.tUid; }
        if (context.targetIndex !== undefined) { this.targetIndex = context.targetIndex; }
        this.context = context;

        //act mandatory: cUid, tUid, targetIndex, aUid, aId, actIndex

        //attack mandatory context: attack, success, element
        //attack context: critical, weak, resist, immune, damageDealt, kill

        //modify mandatory context: modify, success, mUid
        //triggered effect context: triggerEff, tUid, mUid, triggerEffIndex
    }
}

//ADD HANDLING FOR DEAD CHARS IN TARGETLIST
class Modifier {
    constructor (modifier, target, char, action, actIndex) {
        modifiers.push(this);
        Object.assign(this, deepClone(modifier));
        countModifier += 1;
        this.uid = countModifier;
        switch (this.thingType) {
            case 'armour':
                this.armourUid = modifier.uid;
                break;
            case 'accessory':
                this.accessoryUid = modifier.uid;
                break;
        }
        if (target) { this._targetUidList = [target.uid]; }
        if (action) { this.actionId = action.id; }
        if (actIndex) { this.actIndex = actIndex; }
        if (this.id) { this.specialId = this.id; } //stores exclusive id for onePer
        else if (action) {
            this.id = action.id; //if modifier doesn't have its own id, give source's id
            this.actIndex = actIndex;
        }
        if (this.expTime === 'tTurnEnd' && char.uid === activeChar.uid && target.uid === char.uid && actIndex) {
            this.expCount += 1;
        }
        if (char) { 
            console.log(`assigning cUid to ${this.id} from ${char.name}`);
            this.cUid = char.uid;
            console.log(`this.char.name is ${this.char.name}, uid is ${this.char.uid}`);
        } //if char is given, remember char for expiry rules and removal
        // tUid is handled as a getter below

        //COME BACK TO THIS!!!!!!!!!!!!!!!!!!!!!
        this.eff?.forEach(eff => {
            if (!eff.id) {
                eff.id = this.id;
            }; //used to compare the best val of effs of the same type, when eff coexist but don't stack
        });    
        this.triggerEff?.forEach(eff => {
            if (!eff.id) {
                eff.id = this.id;
            }; //used to compare the best val of effs of the same type, when eff coexist but don't stack
            if (this.exhaustCount && eff.exhaustCost === undefined) {
                eff.exhaustCost = 1;
            }
        });
    }
    get targetUidList () {
        let target;
        switch (this.thingType) {
            case 'armour':
                target = characters.find(char => char.armourUid === this.armourUid);
                if (target) {
                    return [target.uid];
                } else {
                    return [];
                }
            case 'accessory':
                target = characters.find(char => char.accessoryUid === this.accessoryUid);
                if (target) {
                    return [target.uid];
                } else {
                    return [];
                }
        }
        if (!this.global) {
            return this._targetUidList;
        } else if (this.global) {
            return combat().map(char => char.uid);
        }
        throw new Error('no targetUidList generated!');
    }
    get targetList () {
        let _targetList = [];
        this.targetUidList.forEach (tUid => {
            _targetList.push(characters.find(char => char.uid === tUid));
        });
        return _targetList;
    }
    give (target) {
        if (!this.global && !this._targetUidList.includes(target.uid)) { this._targetUidList.push(target.uid); }
    }
    checkExpire (time, c) {
        if (this.expCount === undefined && this.exhaustCount === undefined) {
            console.log(`checkExpire mod ${this.id} with expCount ${this.expCount} exhaustCount ${this.exhaustCount}`);
            return;
        }
        console.groupCollapsed(`checkExpire ${this.char.name} mod ${this.id} with expCount ${this.expCount} exhaustCount ${this.exhaustCount}`);
        let expire = false;
        switch (this.expTime) {
            case 'round':
                if (time === 'round') {
                    console.log('EXPIRE: round');
                    this.expCount -= 1;
                }
                break;
            case 'tTurnStart':
                if (time === 'turnStart' && this.targetUidList.includes(c.uid)) {
                    console.log('EXPIRE: tTurnStart');
                    this.expCount -= 1;
                }
                break;
            case 'cTurnStart':
                if (time === 'turnStart' && this.cUid === c.uid) {
                    console.log('EXPIRE: cTurnStart');
                    this.expCount -= 1;
                }
                break;
            case 'tTurnEnd':
                if (time === 'turnEnd' && this.targetUidList.includes(c.uid)) {
                    console.log('EXPIRE: tTurnEnd');
                    this.expCount -= 1;
                }
                break;
            case 'cTurnEnd':
                if (time === 'turnEnd' && this.cUid === c.uid) {
                    console.log('EXPIRE: cTurnEnd');
                    this.expCount -= 1;
                }
                break;
        }
        if (this.expCount <= 0) {
            console.log('mod expires!');
            expire = true;
        }
        if (this.exhaustCount !== undefined && this.exhaustCount <= 0) {
            console.log('mod is exhausted!');
            expire = true;
        }
        if (expire) {
            console.log(`removing char ${this.char} mod ${this.id} ${this.uid} because it expired due to checkExpire`);
            this.remove();
        }
        console.groupEnd();
    }
    remove () {
        const modIndex = modifiers.findIndex(mod => mod.uid === this.uid);
        modifiers.splice(modIndex, 1);
        console.log(`Modifier.remove() removed ${this.id} from modifiers`);
    }
    get char () {
        const _char = characters.find(char => char.uid === this.cUid);
        console.log(`this.char.name is ${_char.name}, uid is ${_char.uid}`);
        return _char;
    }
}

class Effect extends Thing {
    constructor (mod, eff, triggerEffIndex, target) {
        super();
        currentEffs.push(this);
        Object.assign(this, eff);
        this.tUid = target.uid;
        this.mUid = mod.uid;
        if (mod.cUid) {
            this.cUid = mod.cUid;
        }
        this.duration = (this.duration ?? 'turn');
        this.triggerEffIndex = triggerEffIndex;
        if (this.triggerFn) {
            console.log(`triggerFn activated by ${target.name}`);
            this.triggerFn(target);
        }

        if (this.exhaustTime || this.exhaustCost) {
            let exhaustCost = (this.exhaustCost ?? 1);
            let relevantLogs = combatHistory.filter(log =>
                log.round === round &&
                log.turn === turn &&
                log.context.triggerEff &&
                log.context.mUid === mod.uid &&
                log.context.triggerEffIndex == triggerEffIndex);
            switch (this.exhaustTime ?? 'turn') {
                case 'turn':
                    if (relevantLogs.length === 0) { mod.exhaustCount -= exhaustCost; }
                    break;
                case 'act':
                    relevantLogs = relevantLogs.filter(log => log.actIndex === actIndex);
                    if (relevantLogs.length === 0) { mod.exhaustCount -= exhaustCost; }
                    break;
                case 'triggered':
                    mod.exhaustCount -= exhaustCost;
                    break;
            }
        }
        new CombatLog ( {triggerEff: true, tUid: target.uid, mUid: mod.uid, triggerEffIndex: triggerEffIndex} )
    }
    get char () {
        return characters.find(char => char.uid === this.cUid);
    }
    get target () {
        return characters.find(char => char.uid === this.tUid);
    }
}

class AiOption {
    static optionAttackTypes = ['attackBasic', 'attackTeam', 'attackRandom']
    static optionBuffTypes = ['buffAlly', 'buffAllyTeam', 'debuffEnemy', 'debuffEnemyTeam']
    static optionHealTypes = ['healAlly', 'healAllyTeam']
    constructor (char, option) {
        this.cUid = char.uid;
        this.id = option.id;
        this.optionUid = option.uid;
        this.valid = true;
        this.initialised = false;
        this.weight = 0;
        console.log(`creating ${option.name} aiOption for char ${char.name}`);

        if (AiOption.optionAttackTypes.includes(option.aiType)) {
            this.optionType = 'attacker';
        } else if (AiOption.optionBuffTypes.includes(option.aiType)) {
            this.optionType = 'buffer';
        } else if (AiOption.optionHealTypes.includes(option.aiType)) {
            this.optionType = 'healer';
        }

        //assign generic logic by option aiType/id
        if (aiLogicId[option.id]) {
            Object.assign(this, aiLogicId[option.id]);
        } else {
            if (!aiLogicType[option.aiType]) {
                throw new Error(`no logic found for ${option.aiType}`);
            }
            Object.assign(this, aiLogicType[option.aiType]);
        }
    }
    checkWeight () {
        console.groupCollapsed(`activating ${this.char.name} checkWeight function for ${this.option.name}`);
        this.option.action[0].targetList = [];
        if (!this.initialised) {
            this.weight = this.initWeight ?? this.turnWeight ?? this.turnMin ?? this.weight;
            this.weight += (Math.random() / 0.2);
            this.initSet?.();
        }
        if (this.initialised) {
            switch (this.optionType) {
                case 'attacker':
                    if (this.char.aiPersonality === 'attacker') {
                        this.weight = Math.max(this.weight * 0.5, 2);
                    } else {
                        this.weight = Math.max(this.weight * 0.5, 1);
                    }
                    break;
                case 'buffer':
                    if (this.char.aiPersonality === 'buffer' || this.char.aiPersonality === 'support') {
                        this.weight = Math.max(this.weight * 0.5, 2);
                    } else {
                        this.weight = Math.max(this.weight * 0.5, 0.5);
                    }
                    break;
                case 'healer':
                    if (this.char.aiPersonality === 'healer' || this.char.aiPersonality === 'support') {
                        this.weight = Math.max(this.weight * 0.5, 2);
                    } else {
                        this.weight = Math.max(this.weight * 0.5, 0.5);
                    }
                    break;
            }
            if (this.turnWeight) {
                this.weight = this.turnWeight;
            } else {
                if (this.turnMin) {
                    this.weight = Math.max(this.weight + this.turnAdd ?? 0, this.turnMin);
                } else {
                    this.weight += this.turnAdd ?? 0;
                }
            }
        }
        if (this.turnSet) {
            this.turnSet?.();
        }
        if (this.option.thingType === 'item') {
            this.weight = this.weight * 0.85;
        }
        let valid = this.valid;
        let reduce = false;
        const allyTeam = targetTeam(this.char, 'ally');
        const enemyTeam = targetTeam(this.char, 'enemy');
        let thisElement;
        if (this.option.action[0].actFn === 'attack') {
            if (this.char.checkWeaponElement && (this.option.category.includes('weapon') || this.option.category.includes('weaponSkill') || this.char.weapon.category.includes('unarmed') && this.option.category.includes('unarmed'))) {
                thisElement = this.char.checkWeaponElement;
            } else {
                thisElement = this.option.action[0].element;
            }
        }
        let attackElements = [];
        const attacks = this.char.possibleOptions.filter(opt => opt.action[0].actFn === 'attack');
        attacks.forEach(opt => {
            if (this.char.checkWeaponElement && (opt.category.includes('weapon') || opt.category.includes('weaponSkill') || this.char.weapon.category.includes('unarmed') && opt.category.includes('unarmed'))) {
                attackElements.push(this.char.checkWeaponElement);
            } else {
                attackElements.push(opt.action[0].element);
            }
        });
        attackElements = [...new Set(attackElements)];

        switch (this.option.aiReq) {
            case 'selfNotHealthy':
                if (this.char.currentHp === this.char.maxHp) {
                    valid = false;
                }
                break;
            case 'backupAttack':
                const eleIndex = attackElements.findIndex(element => element === thisElement);
                if (eleIndex) {
                    attackElements.splice(eleIndex, 1);
                }
                if (enemyTeam.find(enemy => this.char.memory[enemy.uid]?.weak.includes(thisElement))) {
                    console.log(`an enemy is weak to ${thisElement}! don't reduce this.weight`);
                } else {
                    if (attackElements.length === 0) {
                        console.log(`${thisElement} is your only option! don't reduce weight!`);
                    } else if (enemyTeam.find(enemy => !this.char.memory[enemy.uid])) {
                        console.log(`there's an enemy you know nothing about and you have another attak element! reduce weight!`);
                        valid = false;
                    } else if (enemyTeam.find(enemy => attackElements.some(element => !this.char.memory[enemy.uid].resist.includes(element) && !this.char.memory[enemy.uid].immune.includes(element)))) {
                        console.log(`there's an enemy who you might have a non-resist non-immune attack against! reduce weight!`);
                        valid = false;
                    }
                }
                break;
        }

        switch (this.option.aiPref) {
            case 'selfNotHealthy':
                if (this.char.currentHp === this.char.maxHp) {
                    reduce = true;
                }
                break;
            case 'backupAttack':
                const eleIndex = attackElements.findIndex(element => element === thisElement);
                if (eleIndex) {
                    attackElements.splice(eleIndex, 1);
                }
                if (enemyTeam.find(enemy => this.char.memory[enemy.uid]?.weak.includes(thisElement))) {
                    console.log(`an enemy is weak to ${thisElement}! don't reduce this.weight`);
                } else {
                    if (attackElements.length === 0) {
                        console.log(`${thisElement} is your only option! don't reduce weight!`);
                    } else if (enemyTeam.find(enemy => !this.char.memory[enemy.uid])) {
                        console.log(`there's an enemy you know nothing about and you have another attak element! reduce weight!`);
                        reduce = true;
                    } else if (enemyTeam.find(enemy => attackElements.some(element => !this.char.memory[enemy.uid].resist.includes(element) && !this.char.memory[enemy.uid].immune.includes(element)))) {
                        console.log(`there's an enemy who you might have a non-resist non-immune attack against! reduce weight!`);
                        reduce = true;
                    }
                }
                break;
        }

        if (valid === false) {
            this.weight = 0;
            this.valid = false;
        } else if (reduce && !this.initialised) {
            this.weight = this.weight * 0.5;
        } else if (reduce && this.initialised) {
            this.weight = this.weight * 0.66;
        }
        this.weight = Math.max(this.weight, 0);
        this.initialised = true;
        console.log(`${this.option.name} final option below:`);
        console.log(deepClone(this));
        console.groupEnd();
    }
    get buffStat () {
        let _buffStat = [];
        const option = this.option;
        for (let i = 0; i < option.action.length; ++ i) {
            const thisMod = option.action[0].modifier;
            thisMod.eff?.forEach(eff => {
                if (eff.val > 0 || eff.multi > 1) {
                    _buffStat.push(eff.stat);
                }
            });
            thisMod.triggerEff?.forEach(triggerEff => {
                triggerEff.eff?.forEach(eff => {
                    if (eff.val > 0 || eff.multi > 1) {
                        _buffStat.push(eff.stat);
                    }
                });
            });
        }
        _buffStat = [...new Set(_buffStat)];
        return _buffStat;
    }
    get debuffStat () {
        let _debuffStat = [];
        const option = this.option;
        for (let i = 0; i < option.action.length; ++ i) {
            const thisMod = option.action[0].modifier;
            thisMod.eff?.forEach(eff => {
                if (eff.val < 0 || eff.multi < 1) {
                    _debuffStat.push(eff.stat);
                }
            });
            thisMod.triggerEff?.forEach(triggerEff => {
                triggerEff.eff?.forEach(eff => {
                    if (eff.val > 0 || eff.multi < 1) {
                        _debuffStat.push(eff.stat);
                    }
                });
            });
        }
        _debuffStat = [...new Set(_debuffStat)];
        return _debuffStat;
    }
    get option () {
        return everything.find(thing => thing.uid === this.optionUid);
    }
    get char () {
        return characters.find(char => char.uid === this.cUid);
    }
    get targetLogic () {
        return aiTargetLogic[this._targetLogic];
    }
    filterReq (team) {
        for (let i = team.length - 1; i >= 0; --i) {
            switch (this.option.aiReq) {
                case 'hurt':
                    if (team[i].currentHp / team[i].maxHp > 0.85) {
                        console.log(`${team[i].name} has more than 85% health INVALID`);
                        team.splice(i, 1);
                    }
                    break;
                case 'healthy':
                    if (team[i].currentHp / team[i].maxHp < 0.4) {
                        console.log(`${team[i].name} has less than 40% health INVALID`);
                        team.splice(i, 1);
                    }
                    break;
            }
        }
        return team;
    }
}

const aiLogicType = {
    attackBasic: {
        initWeight: 4,
        turnAdd: 2,
        resetWeight: 2,
        _targetLogic: 'attackSingle',
        turnSet: function () {
            console.log(`activating ${this.option.name} attackBasic turnSet function!`);
            const char = this.char;
            const memory = this.char.memory;
            let enemyTeam = targetTeam (char, 'enemy');
            enemyTeam = this.filterReq(enemyTeam);
            if (enemyTeam.length === 0) {
                console.log(`no enemies meet aiReq INVALID`);
                this.valid = false;
                this.weight = 0;
                return;
            }
            let attackElements = this.option.category.filter(cat => elements.includes(cat));
            if (this.option.category.includes('weapon') || this.option.category.includes('weaponSkill') && char.checkWeaponElement) {
                attackElements = [char.checkWeaponElement];
            }
            if (enemyTeam.every(enemy => memory[enemy.uid]?.weak?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are weak to ${this.option.name}`);
                this.weight += (1.5 / enemyTeam.length);
            } else if (enemyTeam.every(enemy => memory[enemy.uid]?.resist?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are resistant to ${this.option.name}`);
                this.weight -= (1.5 / enemyTeam.length);
            } else if (enemyTeam.every(enemy => memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are neutral to ${this.option.name}`);
            }
            enemyTeam.forEach(enemy => {
                if (memory[enemy.uid]?.weak?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is weak to ${this.option.name}`);
                    this.weight += 1.5;
                }
                if (memory[enemy.uid]?.resist?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is resistant to ${this.option.name}`);
                    this.weight -= 1;
                }
                if (memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is neutral to ${this.option.name}`);
                }   
            });
            if (enemyTeam.find(enemy => enemy.currentHp / enemy.maxHp < 0.25)) {
                console.log(`there is only one enemy remaining, and an enemy has less than 25% health, so increase weight`);
                this.weight = this.weight * 1.1;
            }
            console.log(deepClone(this));
        }
    },
    attackTeam: {
        initWeight: 4,
        turnAdd: 2,
        resetWeight: 2,
        _targetLogic: 'enemyTeam',
        turnSet: function () {
            console.log(`activating ${this.option.name} attackTeam turnSet function!`);
            const char = this.char;
            const memory = this.char.memory;
            const enemyTeam = targetTeam (char, 'enemy');
            let attackElements = this.option.category.filter(cat => elements.includes(cat));
            if (this.option.category.includes('weapon') || this.option.category.includes('weaponSkill') && char.checkWeaponElement) {
                attackElements = [char.checkWeaponElement];
            }
            if (enemyTeam.length === 1) {
                this.weight = this.weight * 0.66;
            } else {
                if (enemyTeam.every(enemy => memory[enemy.uid]?.weak?.some(element => attackElements.includes(element)))) {
                    console.log(`${this.char.name} remembers all enemies are weak to ${this.option.name}`);
                    this.weight += (0.5 * enemyTeam.length);
                } else if (enemyTeam.every(enemy => memory[enemy.uid]?.resist?.some(element => attackElements.includes(element)))) {
                    console.log(`${this.char.name} remembers all enemies are resistant to ${this.option.name}`);
                    this.weight -= 1;
                } else if (enemyTeam.every(enemy => memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element)))) {
                    console.log(`${this.char.name} remembers all enemies are neutral to ${this.option.name}`);
                }
            }
            enemyTeam.forEach(enemy => {
                if (memory[enemy.uid]?.weak?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is weak to ${this.option.name}`);
                    this.weight += 0.75;
                }
                if (memory[enemy.uid]?.resist?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is resistant to ${this.option.name}`);
                    this.weight -= 0.75;
                }
                if (memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is neutral to ${this.option.name}`);
                }   
            });
            console.log(deepClone(this));
        }
    },
    attackRandom: {
        initWeight: 5,
        turnAdd: 2,
        resetWeight: 2,
        _targetLogic: 'enemyRandom',
        turnSet: function () {
            console.log(`activating ${this.option.name} attackRandom turnSet function!`);
            const char = this.char;
            const option = this.option;
            const memory = this.char.memory;
            const enemyTeam = targetTeam (char, 'enemy');
            let attackElements = this.option.category.filter(cat => elements.includes(cat));
            if (this.option.category.includes('weapon') || this.option.category.includes('weaponSkill') && char.checkWeaponElement) {
                attackElements = [char.checkWeaponElement];
            }
            if ((option.randomNumber || option.randomMin || option.randomMax) && !option.targetRepeat && enemyTeam.length < 2) {
                console.log('this random attack targets multiple characters but cannot repeat targets, and there is only one valid target');
                this.weight -= 1;
            }
            if (enemyTeam.every(enemy => memory[enemy.uid]?.weak?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are weak to ${this.option.name}`);
                this.weight += (0.5 * enemyTeam.length);
            } else if (enemyTeam.every(enemy => memory[enemy.uid]?.resist?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are resistant to ${this.option.name}`);
                this.weight -= 1;
            } else if (enemyTeam.every(enemy => memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element)))) {
                console.log(`${this.char.name} remembers all enemies are neutral to ${this.option.name}`);
            }
            enemyTeam.forEach(enemy => {
                if (memory[enemy.uid]?.weak?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is weak to ${this.option.name}`);
                    this.weight += 0.75;
                }
                if (memory[enemy.uid]?.resist?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is resistant to ${this.option.name}`);
                    this.weight -= 0.75;
                }
                if (memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers ${enemy.name} is neutral to ${this.option.name}`);
                }   
            });
            if (enemyTeam.find(enemy => enemy.currentHp / enemy.maxHp < 0.25)
                && enemyTeam.length > 1
                && !this.option.randomNumber || this.option.randomNumber < enemyTeam.length
                && !this.option.randomMin || this.option.randomMin < enemyTeam.length
                && char.possibleOptions.some(opt => opt.actFn === 'attack'
                    && opt.selectTarget === 'enemySingle' || opt.selectTarget === 'enemyTeam' || (opt.selectTarget === 'enemyRandom' && opt.randomMin >= enemyTeam.length || opt.randomNumber >= enemyTeam.length)
                    && !enemy.element.immune.includes(opt.action[0].element))) {
                console.log(`an enemy character is almost dead, this action is random, and you have a non-immune attack likely to target enemy, so reduce weight`);
                this.weight = this.weight * 0.75;
            }
            if (this.option.randomNumber || this.option.randomMin
                && !this.option.targetRepeat
                && enemyTeam.length === 1
                && char.possibleOptions.some(opt => opt.actFn === 'attack'
                    && opt.selectTarget === 'enemySingle' || (opt.selectTarget === 'attackRandom' && (!opt.randomMin && !opt.randomNumber) || opt.targetRepeat)
                    && !enemy.element.immune.includes(opt.action[0].element))) {
                console.log(`this action is intended for multiple possible targets but there is only one target, and you have a non-immune attack likely to target enemy, so reduce weight`);
                this.weight = this.weight * 0.75;
            }
            console.log(deepClone(this));
        }   
    },
    buffAllyTeam: {
        initWeight: 4.5,
        turnAdd: 0.75,
        resetWeight: 0,
        _targetLogic: 'allyTeam',
        turnSet: function () {
            console.log(`activating ${this.option.name} buffAllyTeam turnSet function!`);
            const char = this.char;
            const option = this.option;
            const act = option.action[0];
            const mod = act.modifier;
            let allyTeam = targetTeam (char, 'ally');
            let existingMods = [];
            if (option.selectOther) {
                console.log('this option cannot target the user, so do not consider them');
                allyTeam = allyTeam.filter(ally => ally.uid !== char.uid);
            }
            if (allyTeam.length === 0) {
                console.log('there are no valid targets! this option is invalid')
                this.weight = 0;
                this.valid = false;
                console.log(deepClone(this));
                return;
            }
            const allyUids = allyTeam.map(ally => ally.uid);
            const allyTeamInclusive = targetTeam(char, 'ally', 'include');
            const allyUidsInclusive = allyTeamInclusive.map(ally => ally.uid);
            const enemyUids = targetTeam (char, 'enemy').map(enemy => enemy.uid);
            if (!mod.id) { //use actIndex to differentiate modifiers from the same source
                existingMods = modifiers.filter(exMod => exMod.id === option.id && exMod.actIndex === 0 && exMod.targetUidList.some(uid => allyUids.includes(uid)));
            } else if (mod.id) { //if specialId is given, check for that instead
                existingMods = modifiers.filter(exMod => exMod.specialId === mod.id && exMod.targetUidList.some(uid => allyUids.includes(uid)));
                if (mod.id === 'weather' || mod.id === 'celestial') {
                    console.log(`check existingMods for weather or celestial modifier!`);
                    console.log(`existing mods below:`);
                    console.log(deepClone(existingMods));
                    if (existingMods.some(exMod => enemyUids.includes(exMod.cUid))) {
                        this.weight -= 1.5;
                    } else if (existingMods.some(exMod => allyUidsInclusive.includes(exMod.cUid))) {
                        this.weight = 0;
                        this.valid = false;
                        return;
                    }
                }
            }
            console.log(`found ${existingMods.length} mods with the same id /specialId already applied to the same team by a team member`);
            if (existingMods.length === 0) {
                console.log('no mods already exist');
                this.weight += (Math.random() * 2);
            } else {
                console.log(`${existingMods.length} already target allies, so only increase for each ally without matching buff`);
                let unmodified = allyTeam.filter(char => !existingMods.some(mod => mod.targetUidList.includes(char.uid)));
                unmodified = this.filterReq(unmodified);
                if (unmodified.length > 0) {
                    this.weight += (Math.random() * (allyTeam.length / unmodified.length));
                }
                if (unmodified.length === 0 && (mod.onePerC || mod.onePerId) && mod.remodify === 'replace' || mod.remodify === 'fail') {
                    console.log('all allies already have a matching mod and it cannot stack');
                    this.weight = 0;
                    this.valid =  false;
                    console.log(deepClone(this));
                    return;
                } else if (mod.onePerC || mod.onePerId && mod.remodify === 'replace' || mod.remodify === 'fail') {
                    console.log(`some allies already have matching mod and it can't stack`);
                    this.weight = this.weight * (0.5 + ((unmodified.length / allyTeam.length) * 0.5));
                } else if (unmodified.length === 0) {
                    console.log('every ally already has matching mod but it can stack');
                    this.weight += ((Math.random() * 0.5) - 0.25);
                }
            }
            if (char.currentHp / char.maxHp < 0.25) {
                this.weight = this.weight * 0.66;
            }
            if (allyTeam.length === 1) {
                this.weight = this.weight * 0.66;
            }
            console.log(deepClone(this));
        }
    },
    buffAlly: {
        initWeight: 4.5,
        turnAdd: 0.75,
        resetWeight: 0,
        _targetLogic: 'buffAlly',
        turnSet: function () {
            console.log(`activating ${this.option.name} buffAlly turnSet function!`);
            const char = this.char;
            const option = this.option;
            const act = option.action[0];
            const mod = act.modifier;
            let existingMods = [];
            let allyTeam = targetTeam (char, 'ally');
            if (option.selectOther) {
                console.log('this option cannot target the user, so do not consider them');
                allyTeam = allyTeam.filter(ally => ally.uid !== char.uid);
            } else if (option.selectTarget === 'yourself') {
                console.log('this option can only target the user, so only consider them');
                allyTeam = allyTeam.filter(ally => ally.uid === char.uid);
            }
            if (this.filterReq(allyTeam).length === 0) {
                console.log('there are no valid targets! this option is invalid')
                this.weight = 0;
                this.valid = false;
                console.log(deepClone(this));
                return;
            }
            const allyUids = allyTeam.map(ally => ally.uid);
            if (!mod.id) { //use actIndex to differentiate modifiers from the same source
                existingMods = modifiers.filter(exMod => exMod.id === option.id && exMod.actIndex === 0 && exMod.targetUidList.some(uid => allyUids.includes(uid)));
            } else if (mod.id) { //if specialId is given, check for that instead
                existingMods = modifiers.filter(exMod => exMod.specialId === mod.id && exMod.targetUidList.some(uid => allyUids.includes(uid)));
            }
            let unmodified = allyTeam.filter(enemy => !existingMods.some(mod => mod.targetUidList.includes(enemy.uid)));
            unmodified = this.filterReq(unmodified);
            console.log(`found ${existingMods.length} mods with the same id /specialId already applied to the same team.${unmodified.length} unmodified allies`);
            if (existingMods.length === 0) {
                console.log('no mods already exist');
                this.weight += Math.random() * 1;
                console.log('current state:');
                console.log(deepClone(this));
            } else {
                console.log(`${existingMods.length} already target allies, so only increase for each ally without the buff`);
                this.weight += Math.random() * (unmodified.length * (1 / allyTeam.length))
                if (mod.onePerC === 'global') {
                    console.log('this character can only create one copy of this mod');
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (mod.onePerC === 'target' && (mod.remodify === 'replace' || mod.remodify === 'fail') && allyTeam.every(ally => existingMods.some(exMod => exMod.targetUidList.includes(ally.uid) && exMod.cUid === char.uid))) {
                    console.log(`this character can only apply this modifier once to each target, and all allies have the mod`);
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if ((mod.onePerId === 'global' && mod.onePerId === 'team') && (mod.remodify === 'replace' || mod.remodify === 'fail') && existingMods[0].targetUidList.some(uid => allyUids.includes(uid))) {
                    console.log('only one copy of this mod can exist globally or per team, and it already applies to an ally');
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (mod.onePerId === 'target' && (mod.remodify === 'replace' || mod.remodify === 'fail') && allyTeam.every(ally => existingMods.some(exMod => exMod.targetUidList.includes(ally.uid)))) {
                    console.log(`this modifier id/specialId can only be applied once to each target, and all allies have the mod`);
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (allyTeam.every(ally => existingMods.some(exMod => exMod.targetUidList.includes(ally.uid)))) {
                    console.log('every ally already has this mod but it can stack');
                    this.weight += (-0.25 + (Math.random() * 0.50));
                    console.log('current state:');
                    console.log(deepClone(this));
                }
            }
            if (unmodified.length > 0) {
                let usefulWeight = 0;
                unmodified.forEach(ally => {
                    let useful = ally.useful.filter(use => this.buffStat.includes(use.stat));
                    if (useful.length > 0) {
                        let charWeight = 0;
                        useful.forEach(use => { charWeight += use.finalWeight });
                        usefulWeight += (charWeight / useful.length);
                    }
                });
                this.weight += (usefulWeight / unmodified.length);
                console.log(`added usefulWeight ${usefulWeight} from ${unmodified.length} unmodified chars:`);
            }
            if (char.currentHp / char.maxHp < 0.25) {
                this.weight = this.weight * 0.66;
            }
            console.log(deepClone(this));
        }
    },
    healAlly: {
        initWeight: 0,
        turnAdd: 0,
        resetWeight: 0,
        _targetLogic: 'healAlly',
        turnSet: function () {
            console.log(`activating ${this.option.name} healAlly turnSet function!`);
            const char = this.char;
            const option = this.option;
            const act = option.action[0];
            let allyTeam = targetTeam (char, 'ally');
            allyTeam = this.filterReq(allyTeam);
            if (option.selectOther) {
                console.log('this option cannot target the user, so do not consider them');
                allyTeam = allyTeam.filter(ally => ally.uid !== char.uid);
            } else if (option.selectTarget === 'yourself') {
                console.log('this option can only target the user, so only consider them');
                allyTeam = allyTeam.filter(ally => ally.uid === char.uid);
            }
            if (allyTeam.length === 0) {
                console.log('there are no valid targets! this option is invalid')
                this.weight = 0;
                this.valid = false;
                console.log(deepClone(this));
                return;
            }
            let healPredicts = [];
            for (let i = 0; i < allyTeam.length; ++i) {
                const ally = allyTeam[i];
                const c = this.char;
                const t = ally;
                let allyPredict = { uid: ally.uid, valid: true };
                healPredicts.push(allyPredict);
                if (ally.currentHp / ally.maxHp > 0.75) {
                    allyPredict.valid = false;
                } else if (ally.currentHp / ally.maxHp > 0.5 && char.aiPersonality !== 'healer' && char.aiPersonality !== 'support') {
                    allyPredict.valid = false;
                }
                let heal = act.heal ?? 0; //act.heal
                if (act.healMaxHp) { heal += t.maxHp * (act.healMaxHp / 100); } //act.healMaxHp
                if (act.statHeal) { heal += c[act.statHeal] * (act.healP / 100); } //act.statHeal, act.healP
                heal = heal * c.healTargetM * t.healSelfM; //c.healTargetM, t.healSelfM
                allyPredict.healMax = heal; //how much could this action heal? -> allyPredict.healMax
                const prevHp = t.currentHp;
                const newHp = Math.min(t.currentHp + heal, t.maxHp);
                allyPredict.healDealt = newHp - prevHp; //how much would it heal based on currentHp? -> allyPredict.healDealt
                if (allyPredict.healDealt === 0) {
                    allyPredict.valid = false;
                } else {
                    allyPredict.healProportion = allyPredict.healMax / allyPredict.healDealt; //what proportion of healMax would be dealt? -> allyPredict.healProportion
                    allyPredict.maxHpProportion = allyPredict.healDealt / ally.maxHp; //what proportion of their maxHp would be healed?
                    if (allyPredict.healProportion < 0.5 && allyPredict.maxHpProportion < 0.5) {
                        allyPredict.valid = false;
                    } 
                }
            }
            healPredicts = healPredicts.filter(pred => pred.valid);
            if (healPredicts.length === 0) {
                this.weight = 0;
                this.valid = false;
                console.log('all allies are invalid, mark option invalid');
                return;
            } else {
                if (char.aiPersonality === 'healer' || char.aiPersonality === 'support') {
                    this.weight = Math.max(this.weight / 2, 2);
                    console.log(`${char.name} is a healer/support, so weight is set to half prev weight or 2 at start`);
                } else {
                    this.weight = Math.max(this.weight / 2, 1);
                    console.log(`${char.name} is not a healer, so weight is set to half prev weight or 1 at start`);
                }
                healPredicts.forEach(pred => {
                    const ally = allyTeam.find(char => char.uid === pred.uid);
                    let healWeight = (pred.healProportion + 1) * (pred.maxHpProportion + 1);
                    console.log(`healWeight ${healWeight} from pred.healProportion ${pred.healProportion + 1} * pred.maxHpProportion ${pred.maxHpProportion + 1}`);
                    if (char.aiPersonality === 'healer' || char.aiPersonality === 'support') {
                        if (ally.currentHp / ally.maxHp < 0.25) {
                            healWeight = healWeight * 1.66;
                            console.log(`${char.name} is a healer/support and ${ally.name} hp is below 25%, so multiply by 1.66, giving healWeight ${healWeight}`);
                        } else if (ally.currentHp / ally.maxHp < 0.5) {
                            healWeight = healWeight * 1.34;
                            console.log(`${char.name} is a healer/support and ${ally.name} hp is below 50%, so multiply by 1.2, giving healWeight ${healWeight}`);
                        }
                    } else {
                        if (ally.currentHp / ally.maxHp < 0.25) {
                            healWeight = healWeight * 1.4;
                            console.log(`${char.name} is not a healer and ${ally.name} hp is below 20%, so multiply by 1.4, giving healWeight ${healWeight}`);
                        } else if (ally.currentHp / ally.maxHp > 0.50) {
                            healWeight = healWeight * 0.9;
                            console.log(`${char.name} is not a healer and ${ally.name} hp is above 50%, so multiply by 0.8, giving healWeight ${healWeight}`);
                        }
                    }
                    pred.healWeight = healWeight;
                    console.log(`${ally.name} final healWeight is ${healWeight}`);
                });
                if (healPredicts.length === 1) {
                    console.log(`only one valid healing target, with healWeight ${healPredicts[0].healWeight}`);
                    this.weight += healPredicts[0].healWeight;
                } else {
                    healPredicts = healPredicts.sort((a, b) => b.healWeight - a.healWeight);
                    console.log(`healPredicts after sorting:`);
                    console.log(healPredicts);
                    for (let i = 0; i < healPredicts.length; ++i) {
                        this.weight += (healPredicts[i].healWeight / (i + 1));
                    }
                }
            }
        }
    },
    debuffEnemy: {
        initWeight: 4.25,
        turnAdd: 0.6,
        resetWeight: 0,
        _targetLogic: 'debuffEnemy',
        turnSet: function () {
            const char = this.char;
            const option = this.option;
            const act = option.action[0];
            const mod = act.modifier;
            let enemyTeam = targetTeam(char, 'enemy');
            const enemyUids = enemyTeam.map(enemy => enemy.uid);
            if (!mod.id) { //use actIndex to differentiate modifiers from the same source
                existingMods = modifiers.filter(exMod => exMod.id === option.id && exMod.actIndex === 0 && exMod.targetUidList.some(uid => enemyUids.includes(uid)));
            } else if (mod.id) { //if specialId is given, check for that instead
                existingMods = modifiers.filter(exMod => exMod.specialId === mod.id && exMod.targetUidList.some(uid => enemyUids.includes(uid)));
            }
            let unmodified = enemyTeam.filter(enemy => !existingMods.some(mod => mod.targetUidList.includes(enemy.uid)));
            unmodified = this.filterReq(unmodified);
            console.log(`found ${existingMods.length} mods with the same id /specialId already applied to the same team.${unmodified.length} unmodified enemies`);
            if (existingMods.length === 0) {
                console.log('no mods already exist');
                this.weight += Math.random() * 1;
                console.log('current state:');
                console.log(deepClone(this));
            } else {
                console.log(`${existingMods.length} already target enemies, so only increase for each enemy without the buff`);
                this.weight += Math.random() * (unmodified.length * (1 / enemyTeam.length))
                if (mod.onePerC === 'global') {
                    console.log('this character can only create one copy of this mod');
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (mod.onePerC === 'target' && (mod.remodify === 'replace' || mod.remodify === 'fail') && enemyTeam.every(enemy => existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid) && exMod.cUid === char.uid))) {
                    console.log(`this character can only apply this modifier once to each target, and all enemies have the mod`);
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if ((mod.onePerId === 'global' && mod.onePerId === 'team') && (mod.remodify === 'replace' || mod.remodify === 'fail') && existingMods[0].targetUidList.some(uid => enemyUids.includes(uid))) {
                    console.log('only one copy of this mod can exist globally or per team, and it already applies to an enemy');
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (mod.onePerId === 'target' && (mod.remodify === 'replace' || mod.remodify === 'fail') && enemyTeam.every(enemy => existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid)))) {
                    console.log(`this modifier id/specialId can only be applied once to each target, and all allies have the mod`);
                    this.weight = 0;
                    this.valid = false;
                    console.log('current state:');
                    console.log(deepClone(this));
                }
                if (enemyTeam.every(enemy => existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid)))) {
                    console.log('every enemy already has this mod but it can stack');
                    this.weight += (-0.25 + (Math.random() * 0.50));
                    console.log('current state:');
                    console.log(deepClone(this));
                }
            }
            if (unmodified.length > 0) {
                let usefulWeight = 0;
                unmodified.forEach(enemy => {
                    let useful = enemy.useful.filter(use => this.buffStat.includes(use.stat));
                    if (useful.length > 0) {
                        let charWeight = 0;
                        useful.forEach(use => { charWeight += use.finalWeight });
                        usefulWeight += (charWeight / useful.length);
                    }
                });
                this.weight += (usefulWeight / unmodified.length);
                console.log(`added usefulWeight ${usefulWeight} from unmodified chars:`);
            }
            if (char.currentHp / char.maxHp < 0.25) {
                this.weight = this.weight * 0.66;
            }
            console.log(deepClone(this));
        }
    }
};

const aiLogicId = {
    ginga: {
        initWeight: 6,
        turnMin: 6,
        turnAdd: 3,
        resestWeight: 0,
        _targetLogic: 'yourself',
        turnSet: aiLogicType['buffAlly'].turnSet
    },
    negativa: {
        initWeight: 4.5,
        turnAdd: 1.5,
        resetWeight: 0,
        _targetLogic: 'yourself',
        turnSet: aiLogicType['buffAlly'].turnSet
    },
    newMoon: {
        initWeight: 6,
        turnMin: 6,
        turnAdd: 2,
        resestWeight: 0,
        _targetLogic: 'everyone',
        turnSet: aiLogicType['buffAllyTeam'].turnSet
    }
};

const aiTargetLogic = {
    attackSingle: function () {
        console.groupCollapsed(`processing targetLogic for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const act = this.option.action[0];
        const memory = this.char.memory;
        let enemyTeam = targetTeam (char, 'enemy');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('memory below');
        console.log(deepClone(memory));
        console.log('enemy team below:');
        console.log(enemyTeam);

        enemyTeam = this.filterReq(enemyTeam);
        if (enemyTeam.length === 1) {
            console.log(`only one target option in enemy team! target is ${enemyTeam[0].name}`);
            act.targetList = [enemyTeam[0]];
            console.groupEnd();
            return;
        }
        let targets = [];
        enemyTeam.forEach(enemy => {
            let targetWeight = {t: enemy, enemyName: enemy.name, weight: 3};
            const randomWeight = Math.random() * 1.5; //0-1.49 range
            targetWeight.weight += randomWeight;
            targets.push(targetWeight);
            let attackElements = this.option.category.filter(cat => elements.includes(cat));
            if (this.option.category.includes('weapon') || this.option.category.includes('weaponSkill') && char.checkWeaponElement) {
                attackElements = [char.checkWeaponElement];
            }
            if (memory[enemy.uid]?.weak?.some(element => attackElements.includes(element))) {
                console.log(`${this.char.name} remembers ${enemy.name} is weak to ${this.option.name}`);
                targetWeight.weight += 4.5;
            }
            if (memory[enemy.uid]?.resist?.some(element => attackElements.includes(element))) {
                console.log(`${this.char.name} remembers ${enemy.name} is resistant to ${this.option.name}`);
                targetWeight.weight -= 2.5;
            }
            if (memory[enemy.uid]?.immune?.some(element => attackElements.includes(element))) {
                console.log(`${this.char.name} remembers ${enemy.name} is immune to ${this.option.name}`);
                targetWeight.weight -= 3;
            }
            if (memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element))) {
                console.log(`${this.char.name} remembers ${enemy.name} is neutral to ${this.option.name}`);
            }
            if (!memory[enemy.uid]?.neutral?.some(element => attackElements.includes(element))
                && !memory[enemy.uid]?.resist?.some(element => attackElements.includes(element))
                && !memory[enemy.uid]?.weak?.some(element => attackElements.includes(element))) {
                    console.log(`${this.char.name} remembers nothing about ${enemy.name}'s resistance to ${this.option.name}`);
                    targetWeight.weight += Math.random() * 2;
            }
            if (memory[enemy.uid]?.attackedMe) {
                console.log(`${this.char.name} remembers ${enemy.name} attackedMe`);
                targetWeight.weight = targetWeight.weight * 1.1;
            }
            if (enemy.currentHp / enemy.maxHp < 0.34) {
                console.log(`${enemy.name}'s health is less than 34%`);
                targetWeight.weight = (targetWeight.weight * 2) + 4;
            } else if (enemy.currentHp / enemy.maxHp < 0.66) {
                console.log(`${enemy.name}'s health is less than 66%`);
                targetWeight.weight = (targetWeight.weight * 1.66) + 1.5;
            } else if (enemy.currentHp / enemy.maxHp < 0.85) {
                console.log(`${enemy.name}'s health is less than 85%`);
                targetWeight.weight = targetWeight.weight * 1.34;
            }
            console.log(targetWeight);
        });
        targets = targets.sort((a, b) => b.weight - a.weight);
        console.log('targets below after considering weights:');
        console.log(targets);
        totalWeight = targets[0].weight + targets[1].weight;
        const randomNumber = Math.random() * totalWeight;
        if (randomNumber <= targets[0].weight) {
            act.targetList = [targets[0].t];
        } else if (randomNumber > targets[0].weight) {
            act.targetList = [targets[1].t];
        }
        console.log(`target selected is ${act.targetList[0].name}`);
        console.groupEnd();
    },
    enemyTeam: function () {
        console.groupCollapsed(`processing targetLogic for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const act = this.option.action[0];
        const enemyTeam = targetTeam (char, 'enemy');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('enemy team below:');
        console.log(enemyTeam);
        act.targetList = enemyTeam;
        console.groupEnd();
    },
    enemyRandom: function () {
        console.groupCollapsed(`processing targetLogic for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const option = this.option;
        const act = this.option.action[0];
        let enemyTeam = targetTeam (char, 'enemy');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('enemy team below:');
        console.log(enemyTeam);
        if (!option.randomNumber && !option.randomMin) {
            const targetIndex = Math.floor(Math.random() * enemyTeam.length);
            act.targetList = [enemyTeam[targetIndex]];
        } else if (option.randomNumber) {
            for (let i = 1; (i <= option.randomNumber && enemyTeam.length > 0); ++i) {
                const targetIndex = Math.floor(Math.random() * enemyTeam.length);
                act.targetList.push(enemyTeam[targetIndex]);
                if (!option.targetRepeat) {
                    enemyTeam.splice(targetIndex, 1);
                }
            }
        } else if (option.randomMin && option.randomMax) {
            const randomRange = (option.randomMax - option.randomMin);
            const randomAdd = Math.floor(Math.random () * (randomRange + 1));
            const targetCount = option.randomMin + randomAdd;
            for (let i = 1; (i <= targetCount && enemyTeam.length > 0); ++i) {
                const targetIndex = Math.floor(Math.random() * enemyTeam.length);
                act.targetList.push(enemyTeam[targetIndex]);
                if (!option.targetRepeat) {
                    enemyTeam.splice(targetIndex, 1);
                }
            }
        }
        console.groupEnd();
    },
    allyTeam: function () {
        console.groupCollapsed(`processing targetLogic buffAllyTeam for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const option = this.option;
        const act = this.option.action[0];
        let allyTeam = targetTeam (char, 'ally');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('ally team below:');
        console.log(allyTeam);
        if (option.selectOther) { allyTeam = allyTeam.filter(ally => ally.uid !== char.uid); }
        if (allyTeam.length === 0) { throw new Error('no valid targets for targetLogic buffAlllyTeam!'); }
        act.targetList = allyTeam;
        console.groupEnd();
    },
    buffAlly: function () {
        console.groupCollapsed(`processing targetLogic buffAlly for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const act = this.option.action[0];
        const memory = this.char.memory;
        const enemyTeam = targetTeam (char, 'enemy');
        let allyTeam = targetTeam (char, 'ally');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('ally team below:');
        console.log(allyTeam);
        console.log('memory below:');
        console.log(deepClone(memory));
        console.log('enemy team below:');
        console.log(enemyTeam);

        const option = this.option;
        const mod = act.modifier;
        let existingMods = [];
        let targets = [];
        allyTeam = this.filterReq(allyTeam);
        if (option.selectOther) {
            console.log(`this option cannot target the user, so don't consider them`);
            allyTeam = allyTeam.filter(ally => ally.uid !== char.uid);
        } else if (option.selectTarget === 'yourself') {
            console.log('this option can only target the user, so only consider them');
            allyTeam = allyTeam.filter(ally => ally.uid === char.uid);
        }
        if (allyTeam.length === 1) {
            console.log(`only one target option in ally team! target is ${allyTeam[0].name}`);
            act.targetList = [allyTeam[0]];
            console.groupEnd();
            return;
        }
        const allyUids = allyTeam.map(ally => ally.uid);
        if (!mod.id) { //use actIndex to differentiate modifiers from the same source
            existingMods = modifiers.filter(exMod => exMod.id === option.id && exMod.actIndex === 0 && exMod.targetUidList.some(uid => allyUids.includes(uid)));
        } else if (mod.id) { //if specialId is given, check for that instead
            existingMods = modifiers.filter(exMod => exMod.specialId === mod.id && exMod.targetUidList.some(uid => allyUids.includes(uid)));
        }
        console.log(`found ${existingMods.length} mods with the same id /specialId already applied to the same team`);
        allyTeam.forEach(ally => {
            let targetWeight = {t: ally, weight: 2};
            targets.push(targetWeight);
            const randomWeight = Math.random() * 0.5; //0-0.49 range
            targetWeight.weight += randomWeight;
            if (existingMods.some(exMod => exMod.targetUidList.includes(ally.uid) && exMod.cUid === char.uid) && mod.onePerC === 'target') {
                console.log(`this mod can only be applied once per source char or source id, and ${char.name} has already made one, so ${ally.name} is not a good target`);
                targetWeight.weight -= 3;
            } else if (existingMods.some(exMod => exMod.targetUidList.includes(ally.uid)) && (mod.onePerId === 'target')) {
                console.log(`this mod can only be applied once per action id, so ${ally.name} is not a good target`);
                targetWeight.weight -= 3;
            } else if (existingMods.some(exMod => exMod.targetUidList.includes(ally.uid))) {
                console.log(`${ally.name} already has this mod, but no onePer rules apply, so make low priority`);
                targetWeight.weight -= 1.5;
            }

            console.log('determine what buffed stats are useful for this ally');
            let useful = ally.useful; //contains objs with .stat and .weight (represent which stats are most useful)
            console.log('useful below:');
            console.log(deepClone(useful));
            useful = useful.filter(use => this.buffStat.includes(use.stat));
            console.log(`consider only the stats that are useful to the character ${ally.name} and that this mod buffs:`);
            console.log(deepClone(useful));
            useful.forEach(use => {
                if (existingMods.some(exMod => exMod.targetUidList.includes(ally.uid))) {
                    targetWeight.weight += (use.finalWeight * 0.5);
                } else {
                    targetWeight.weight += use.finalWeight;
                }
            });
        });
        targets = targets.sort((a, b) => b.weight - a.weight);
        targets.forEach(target => target.weight = Math.max(target.weight, 0.01));
        console.log('targets below after considering weights:');
        console.log(targets);
        totalWeight = targets[0].weight + targets[1].weight ?? 0;
        const randomNumber = Math.random() * totalWeight;
        if (randomNumber <= targets[0].weight) {
            act.targetList = [targets[0].t];
            console.log(`target selected is ${act.targetList[0].name}:`);
            console.log(deepClone(targets[0]));
        } else if (randomNumber > targets[0].weight) {
            act.targetList = [targets[1].t];
            console.log(`target selected is ${act.targetList[0].name}`);
            console.log(deepClone(targets[1]));
        }
        console.groupEnd();
    },
    healAlly: function () {
        console.groupCollapsed(`processing targetLogic healAlly for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const act = this.option.action[0];
        let allyTeam = targetTeam (char, 'ally');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('ally team below:');
        console.log(allyTeam);
        const option = this.option;
        allyTeam = this.filterReq(allyTeam);
        if (option.selectOther) {
            console.log(`this option cannot target the user, so don't consider them`);
            allyTeam = allyTeam.filter(ally => ally.uid !== char.uid);
        } else if (option.selectTarget === 'yourself') {
            console.log('this option can only target the user, so only consider them');
            allyTeam = allyTeam.filter(ally => ally.uid === char.uid);
        }
        if (allyTeam.length === 1) {
            console.log(`only one target option in ally team! target is ${allyTeam[0].name}`);
            act.targetList = [allyTeam[0]];
            console.groupEnd();
            return;
        }
        let healPredicts = [];
        for (let i = 0; i < allyTeam.length; ++i) {
            const ally = allyTeam[i];
            const t = ally;
            const c = this.char;
            let allyPredict = { t: ally, valid: true };
            healPredicts.push(allyPredict);
            if (ally.currentHp / ally.maxHp > 0.75) {
                allyPredict.valid = false;
            } else if (ally.currentHp / ally.maxHp > 0.5 && char.aiPersonality !== 'healer' && char.aiPersonality !== 'support') {
                allyPredict.valid = false;
            }
            let heal = act.heal ?? 0; //act.heal
            if (act.healMaxHp) { heal += t.maxHp * (act.healMaxHp / 100); } //act.healMaxHp
            if (act.statHeal) { heal += c[act.statHeal] * (act.healP / 100); } //act.statHeal, act.healP
            heal = heal * c.healTargetM * t.healSelfM; //c.healTargetM, t.healSelfM
            allyPredict.healMax = heal; //how much could this action heal? -> allyPredict.healMax
            const prevHp = t.currentHp;
            const newHp = Math.min(t.currentHp + heal, t.maxHp);
            allyPredict.healDealt = newHp - prevHp; //how much would it heal based on currentHp? -> allyPredict.healDealt
            if (allyPredict.healDealt === 0) {
                allyPredict.valid = false;
            } else {
                allyPredict.healProportion = allyPredict.healMax / allyPredict.healDealt; //what proportion of healMax would be dealt? -> allyPredict.healProportion
                allyPredict.maxHpProportion = allyPredict.healDealt / ally.maxHp; //what proportion of their maxHp would be healed?
                if (allyPredict.healProportion < 0.5 && allyPredict.maxHpProportion < 0.5) {
                    allyPredict.valid = false;
                } 
            }
        }
        healPredicts = healPredicts.filter(pred => pred.valid);
        if (healPredicts.length === 1) {
            act.targetList = [healPredicts[0].t];
            console.log(`only one possible target, target selected is ${act.targetList[0].name}`);
            console.groupEnd();
            return;
        }
        healPredicts.forEach(pred => {
            const ally = pred.t;
            let healWeight = (pred.healProportion + 1) * (pred.maxHpProportion + 1);
            if (ally.currentHp / ally.maxHp < 0.25) {
                healWeight = healWeight * 2.5;
            } else if (ally.currentHp / ally.maxHp < 0.5) {
                healWeight = healWeight * 1.5;
            }
            pred.healWeight = healWeight;
        });
        targets = healPredicts.sort((a, b) => b.healWeight - a.healWeight);
        console.log('targets below after considering healWeights:');
        console.log(targets);
        totalWeight = targets[0].healWeight + targets[1].healWeight;
        const randomNumber = Math.random() * totalWeight;
        if (randomNumber <= targets[0].healWeight) {
            act.targetList = [targets[0].t];
        } else if (randomNumber > targets[0].healWeight) {
            act.targetList = [targets[1].t];
        }
        console.log(`target selected is ${act.targetList[0].name}`);
        console.groupEnd();
    },
    debuffEnemy: function () {
        console.groupCollapsed(`processing targetLogic debuffEnemy for ${this.char.name}'s ${this.option.name}`);
        const char = this.char;
        const act = this.option.action[0];
        const memory = this.char.memory;
        let enemyTeam = targetTeam (char, 'enemy');
        const allyTeam = targetTeam (char, 'ally');
        console.log(`executing targetLogic for aiOption ${this.option.name}`);
        console.log('char below:');
        console.log(char);
        console.log('act below:');
        console.log(act);
        console.log('ally team below:');
        console.log(allyTeam);
        console.log('memory below:');
        console.log(deepClone(memory));
        console.log('enemy team below:');
        console.log(enemyTeam);

        const option = this.option;
        const mod = act.modifier;
        let existingMods = [];
        let targets = [];

        enemyTeam = this.filterReq(enemyTeam);
        if (enemyTeam.length === 1) {
            console.log(`only one target option in enemy team! target is ${enemyTeam[0].name}`);
            act.targetList = [enemyTeam[0]];
            console.groupEnd();
            return;
        }
        const enemyUids = enemyTeam.map(enemy => enemy.uid);
        if (!mod.id) { //use actIndex to differentiate modifiers from the same source
            existingMods = modifiers.filter(exMod => exMod.id === option.id && exMod.actIndex === 0 && exMod.targetUidList.some(uid => enemyUids.includes(uid)));
        } else if (mod.id) { //if specialId is given, check for that instead
            existingMods = modifiers.filter(exMod => exMod.specialId === mod.id && exMod.targetUidList.some(uid => enemyUids.includes(uid)));
        }
        console.log(`found ${existingMods.length} mods with the same id /specialId already applied to the same team`);
        enemyTeam.forEach(enemy => {
            let targetWeight = {t: enemy, tName: enemy.name, weight: 2};
            targets.push(targetWeight);
            const randomWeight = Math.random() * 0.5; //0-0.49 range
            targetWeight.weight += randomWeight;
            if (existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid) && exMod.cUid === char.uid) && mod.onePerC === 'target') {
                console.log(`this mod can only be applied once per source char or source id, and ${char.name} has already made one, so ${enemy.name} is not a good target`);
                targetWeight.weight -= 3;
            } else if (existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid)) && (mod.onePerId === 'target')) {
                console.log(`this mod can only be applied once per action id, so ${enemy.name} is not a good target`);
                targetWeight.weight -= 3;
            } else if (existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid))) {
                console.log(`${enemy.name} already has this mod, but no onePer rules apply, so make low priority`);
                targetWeight.weight -= 1.5;
            }

            console.log('determine what buffed stats are useful for this enemy');
            let useful = enemy.useful; //contains objs with .stat and .weight (represent which stats are most useful)
            console.log('useful below:');
            console.log(deepClone(useful));
            useful = useful.filter(use => this.debuffStat.includes(use.stat));
            console.log(`consider only the stats that are useful to the character ${enemy.name} and that this mod buffs:`);
            console.log(deepClone(useful));
            useful.forEach(use => {
                if (existingMods.some(exMod => exMod.targetUidList.includes(enemy.uid))) {
                    targetWeight.weight += (use.finalWeight * 0.5);
                } else {
                    targetWeight.weight += use.finalWeight;
                }
            });
        });
        targets = targets.sort((a, b) => b.weight - a.weight);
        targets.forEach(target => target.weight = Math.max(target.weight, 0.01));
        console.log('targets below after considering weights:');
        console.log(targets);
        totalWeight = targets[0].weight + targets[1].weight ?? 0;
        const randomNumber = Math.random() * totalWeight;
        if (randomNumber <= targets[0].weight) {
            act.targetList = [targets[0].t];
            console.log(`target selected is ${act.targetList[0].name}:`);
            console.log(deepClone(targets[0]));
        } else if (randomNumber > targets[0].weight) {
            act.targetList = [targets[1].t];
            console.log(`target selected is ${act.targetList[0].name}`);
            console.log(deepClone(targets[1]));
        }
        console.groupEnd();
    },
    yourself: function () {
        const act = this.option.action[0];
        act.targetList = [this.char];
    },
    everyone: function () {
        const act = this.option.action[0];
        act.targetList = [...combat()];
    }
};

class Character extends Thing {
    static primaryStats = ['str', 'agi', 'for', 'int', 'cha', 'wil'];
    static modifiedStats =  ['baseHp', 'baseMp', 'initiative', 'critMultiplier', 'accuracy', 'damage', 'critChance', 'dodge'];
    static modifiedM = ['accuracyM', 'critChanceM', 'dodgeM', 'defenceM', 'critMultiplierM', 'damageM', 'healSelfM', 'healTargetM'];
    constructor (id, thingType, team) {
        super(id, thingType);
        characters.push(this);

        let cloneChar = deepClone(baseCharacter[id]);
        if (!cloneChar) {
            throw new Error(`baseCharacter matching ${id} not found!`);
        }
        this.id = id;
        if (cloneChar.talkId) {
            this.talkId = cloneChar.talkId;
        }
        this.team = (team ?? 'enemy');
        this.dead = (cloneChar.dead ?? false);
        this._name = cloneChar.name;
        this.memory = {};
        this.aiOptions = [];
        this.personality = '';
        this.aiPersonality = cloneChar.aiPersonality ?? '';

        if (cloneChar.creature) {
            this.gen = 'it';
        } else {
            if (cloneChar.gen) {
                this.gen = cloneChar.gen;
            } else {
                let randomGender = Math.floor(Math.random() * 100) + 1;
                if (randomGender <= 49.5) {
                    this.gen = 'f';
                } else if (randomGender <= 99) {
                    this.gen = 'm';
                } else if (randomGender <= 100) {
                    this.gen = 'n';
                }
            }
            if (cloneChar.nameList) {
                const nameList = cloneChar.nameList[this.gen];
                const random = Math.floor(Math.random () * nameList.length);
                this.realName = nameList[random];
            }
        }

        this._weak = ([...new Set(cloneChar.weak)] ?? []);
        this._resist = ([...new Set(cloneChar.resist)] ?? []);
        this._immune = ([...new Set(cloneChar.immune)] ?? []);

        //create individual skills for each defaultSkills
        this.skillUidList = [];
        this.itemUidList = [];
        cloneChar.defaultSkill?.forEach(skillId => {
            const skill = new ActThing (skillId, 'skill');
            this.skillUidList.push(skill.uid);
        });
        cloneChar.defaultItem?.forEach(itemId => {
            this.giveItem(itemId);
        });

        const allStats = [...Character.primaryStats, ...Character.modifiedStats, ...Character.modifiedM];
        // primaryStats: minimum 1
        // 'str', 'agi', 'for', 'int', 'cha', 'wil'
        // modifiedStats: no minimum, except critMultiplier is minimum 0
        // 'baseHp', 'baseMp', 'initiative', 'accuracy', 'damage', 'critChance', 'dodge', 'critMultiplier' 
        // modifier.eff / triggerEff.eff should contain .stat and either .val or .multi (num > 0)

        // modifiedM: minimum greater than 0
        // 'accuracyM', 'critChanceM', 'dodgeM', 'defenceM', 'critMultiplierM', 'damageM' - min > 0
        // modifier.eff / triggerEff.eff should contain only .multi (num > 0)
        allStats.forEach(stat => {
            if (Character.primaryStats.includes(stat) || Character.modifiedM.includes(stat)) {
                this[`_${stat}`] = (cloneChar[stat] ?? 1);
            } else if (Character.modifiedStats.includes(stat)) {
                this[`_${stat}`] = (cloneChar[stat] ?? 0);
            }
            Object.defineProperty(this, stat, {
                get() {
                    let _stat = this[`_${stat}`];
                    if (stat === 'initiative') {
                        _stat += this.agi + (this.initRoll ?? 0);
                    }
                    let multiplier = 1;
                    let mods = this.mods.filter(mod => mod.eff?.some(eff => eff.stat === stat));
                    mods.forEach(mod => {
                        let effs = mod.eff.filter(eff => eff.stat === stat);
                        effs.forEach(eff => {
                            if (!Character.modifiedM.includes(stat)) {
                                _stat += (eff.val ?? 0);
                            }
                            multiplier = multiplier * (eff.multi ?? 1);
                        });
                    });
                    let triggerEffs = currentEffs.filter(triggerEff =>
                        triggerEff.tUid === this.uid &&
                        triggerEff.eff?.some(eff => eff.stat === stat));
                    triggerEffs.forEach(triggerEff => {
                        let statEffs = triggerEff.eff.filter(eff => eff.stat === stat);
                        statEffs.forEach(eff => {
                            if (!Character.modifiedM.includes(stat)) {
                                _stat += (eff.val ?? 0);
                            }
                            multiplier = multiplier * (eff. multi ?? 1);
                        });
                    });
                    _stat = _stat * multiplier;
                    if (Character.primaryStats.includes(stat) || stat === 'critMultiplierM') {
                        return Math.floor(Math.max(1, _stat));
                    } else if (stat === 'critMultiplier') {
                        return Math.max(0, _stat);
                    } else {
                        return _stat;
                    }
                }
            });
        });

        this.condition = {};
        elements.forEach(element => {
            this.condition[`${element}`] = { val: 0, apply: 0, appliedUid: []};
        });


        //current values need to be determined after getters declared
        this._currentHp = this.maxHp;
        this._currentMp = this.maxMp;

        const weaponIndex = Math.floor(Math.random() * cloneChar.defaultWeapon.length);
        const weapon = new ActThing(cloneChar.defaultWeapon[weaponIndex], 'weapon');
        this.weaponUid = weapon.uid;
        if (cloneChar.defaultArmour) {
            const armourIndex = Math.floor(Math.random() * cloneChar.defaultArmour.length);
            const armour = new ActThing(cloneChar.defaultArmour[armourIndex], 'armour');
            this.armourUid = armour.uid;
        } else {
            const armour = new ActThing('noArmour', 'armour');
            this.armourUid = armour.uid;
        }
        if (cloneChar.defaultAccessory) {
            const accessoryIndex = Math.floor(Math.random() * cloneChar.defaultAccessory.length);
            const accessory = new ActThing(cloneChar.defaultAccessory[accessoryIndex], 'accessory');
            this.accessoryUid = accessory.uid;
        } else {
            const accessory = new ActThing('noAccessory', 'accessory');
            this.accessoryUid = accessory.uid;
        }

        this.sentiment = (cloneChar.sentiment ?? 0);
        if (this.team === 'enemy' && cloneChar.canTalk) {
            this.canTalk = true;
            if (this.talkId) {
                this.convo = {
                    playerTopics: deepClone(baseDialogue[this.talkId].playerTopics),
                    initiatePlayer: deepClone(baseDialogue[this.talkId].initiatePlayer),
                    usedPlayer: [],
                    targetTopics: deepClone(baseDialogue[this.talkId].targetTopics),
                    initiateTarget: deepClone(baseDialogue[this.talkId].initiateTarget),
                    usedTarget: [],
                    ignoredText: deepClone(baseDialogue[this.talkId].ignoredText)
                };
            } else {
                this.convo = {
                    playerTopics: deepClone(baseDialogue[this.id].playerTopics),
                    initiatePlayer: deepClone(baseDialogue[this.id].initiatePlayer),
                    usedPlayer: [],
                    targetTopics: deepClone(baseDialogue[this.id].targetTopics),
                    initiateTarget: deepClone(baseDialogue[this.id].initiateTarget),
                    usedTarget: [],
                    ignoredText: deepClone(baseDialogue[this.id].ignoredText)
                };
            }
            const convo = this.convo;
            for (let i = 0; i < convo.playerTopics.length; ++i) {
                const topic = convo.playerTopics[i];
                topic.index = i;
            }
            for (let i = 0; i < convo.targetTopics.length; ++i) {
                const topic = convo.targetTopics[i];
                topic.index = i;
                for (let ii = 0; ii < topic.answerOptions?.length; ++ii) {
                    const answer = topic.answerOptions[ii];
                    answer.index = ii;
                }
            }
            const coinFlip = Math.floor(Math.random() * 2);
            if (coinFlip === 0) {
                convo.speakNext = true;
            } else {
                convo.speakNext = false;
            }
        }
    }
    topics (type) {
        let _topics;
        let usedIndex;
        switch (type) {
            case 'player':
                _topics = deepClone(this.convo.playerTopics);
                usedIndex = this.convo.usedPlayer;
                break;
            case 'target':
                _topics = deepClone(this.convo.targetTopics);
                usedIndex = this.convo.usedTarget;
                break;
        }
        _topics = _topics.filter(topic => !usedIndex.includes(topic.index));
        _topics.forEach(topic => {
            topic.valid = true;
            if (topic.req) {
                if (topic.req.includes('healthCritical')) {
                    topic.valid = false;
                    if (this.currentHp < this.maxHp * 0.34) {
                        topic.valid = true;
                    }
                } else if (topic.req.includes('healthLow')) {
                    topic.valid = false;
                    if (this.currentHp < this.maxHp * 0.5) {
                        topic.valid = true;
                    }
                } else if (topic.req.includes('healthHigh')) {
                    topic.valid = false;
                    if (this.currentHp > this.maxHp * 0.8) {
                        topic.valid = true;
                    }
                }
                if (topic.req.includes('sentiment15')) {
                    topic.valid = false;
                    if (this.sentiment >= 15) {
                        topic.valid = true;
                    }
                } else if (topic.req.includes('sentiment10')) {
                    topic.valid = false;
                    if (this.sentiment >= 10) {
                        topic.valid = true;
                    }
                } else if (topic.req.includes('sentiment5')) {
                    topic.valid = false;
                    if (this.sentiment >= 5) {
                        topic.valid = true;
                    }
                }
            }
        });
        _topics = _topics.filter(topic => topic.valid === true);
        return _topics;
    }
    adjustConTurn () {
        elements.forEach(element => {
            this.adjustCon(element, 'turnStart');
        });
    }
    adjustCon (element, adjust, val) {
        const condition = this.condition[element];
        switch (adjust) {
            case 'damage':
                if (!this.element.resist.includes(element) && !this.element.immune.includes(element)) {
                    condition.val += val;
                    console.log(`${this.name}'s ${element} condition val is ${condition.val} after conDamage ${val} element ${element}`);
                }
                break;
            case 'heal':
                condition.val = Math.max(0, condition.val - val);
                break;
            case 'turnStart':
                if (condition.apply) { condition.val = Math.max(0, condition.val - 2); }
                else { condition.val = Math.max(0, condition.val - 1); }
                break;
        }
        switch (element) {
            case 'phys':
            case 'mind':
                if (condition.val >= 5) { condition.apply = Math.floor(condition.val / 5); }
                break;
            default:
                if (condition.val >= 5) { condition.apply = 1; }
                break;
        }
        if (element === 'phys' || element === 'mind') {
            if (condition.appliedUid.length < condition.apply) {
                console.log(`${element} conditions need to be applied!`);
                const newApply = condition.apply - condition.appliedUid.length;
                let newCons = baseCon[element].filter(newCon => !this.mods.some(mod => mod.specialId === newCon.id));
                for (let i = 1; i <= newApply && newCons.length > 0; ++i) {
                    const rand = Math.floor(Math.random() * newCons.length);
                    const m = new Modifier(newCons[rand], this);
                    condition.appliedUid.push(m.uid);
                    newCons.splice(rand, 1);
                    console.log(`applied condition ${m.id}`);
                    createMessage('con', m.textInflict(this));
                }
            } else if (condition.appliedUid.length > condition.apply) {
                console.log(`${element} conditions need to be removed!`);
                const unapply = condition.appliedUid.length - condition.apply;
                for (let i = 1; i <= unapply; ++i) {
                    const unapplyUid = condition.appliedUid[0];
                    const unapplyMod = modifiers.find(mod => mod.uid === unapplyUid);
                    unapplyMod.remove();
                    condition.appliedUid.splice(0, 1);
                    console.log(`removed condition ${unapplyMod.id}`);
                    createMessage('con', m.textRemove(this));
                }
            }
        } else {
            if (condition.apply && !this.mods.some(mod => mod.specialId === `${element}Con`)) {
                console.log(`${element} condition needs to be applied!`);
                const m = new Modifier(baseCon[element], this);
                condition.appliedUid = [m.uid];
                console.log(`applied condition ${m.id}`);
                createMessage('con', m.textInflict(this));
            } else if (condition.apply === 0 && this.mods.some(mod => mod.specialId === `${element}Con`)) {
                console.log(`${element} condition needs to be removed!`);
                const unapplyMod = modifiers.find(mod => mod.specialId === `${element}Con`);
                unapplyMod.remove();
                condition.appliedUid = [];
                console.log(`removed condition ${unapplyMod.id}`);
                createMessage('con', m.textRemove(this));
            }
        }
    }
    get equipment () {
        let _equipment = [];
        if (this.weapon) { _equipment.push(this.weapon); }
        if (this.armour) { _equipment.push(this.armour); }
        return _equipment;
    }
    get useful () {
        console.groupCollapsed(`checking what stats are useful for ${this.name}`);
        let _useful = [];
        let enemyTeam = targetTeam(this, 'enemy');
        let useCount = 0; //how many options are actually relevant to this comparison?
        this.possibleOptions.forEach(opt => {
            if (opt.action.some(act => act.statDam)) {
                useCount += 1;
            }
            opt.action.forEach(act => {
                if (act.statDam && !_useful.some(use => use.stat === act.statDam)) {
                        //create new use consideration for statDam
                        _useful.push({stat: act.statDam, weight: 0})
                }
            });
            _useful.forEach(use => {
                if (opt.action.some(act => act.statDam === use.stat)) {
                    use.weight += 0.5;
                    let attackElements = opt.category.filter(cat => elements.includes(cat));
                    if (opt.category.includes('weapon' || 'weaponSkill') && this.checkWeaponElement) {
                        attackElements = [this.checkWeaponElement];
                    }
                    if (enemyTeam.some(enemy => this.memory[enemy.uid]?.weak?.some(element => attackElements.includes(element)))) {
                        console.log(`${this.name} action ${opt.name} is an attack that uses ${use.stat} and ${this.name} knows targets a weakness`);
                        use.weight += 1;
                    } else { console.log(`${this.name} action ${opt.name} is an attack that uses ${use.stat}`); }
                }
            });
            _useful.forEach(use => {
                //divide by number of considered options to make weight proportionate
                use.finalWeight = (use.weight / useCount);
            });
        });
        console.groupEnd();
        return _useful;
    }
    meet (t) {
        const mem = {
            weak: [],
            resist: [],
            immune: [],
            neutral: [],
            attackedMe: false,
            usedAttackUids: []
        };
        Object.defineProperty(mem, 'usedAttacks', {
            get () {
                let _usedAttacks = [];
                mem.usedAttackUids.forEach(uid => {
                    _usedAttacks.push(everything.find(thing => thing.uid === uid));
                });
                return _usedAttacks;
            }
        });
        this.memory[t.uid] = mem;
    }
    remember (memoryType, t, context) {
        if (!this.memory[t.uid]) { this.meet(t); }
        const { action, element } = context;
        const mem = this.memory[t.uid];
        switch (memoryType) {
            case 'weak':
            case 'resist':
            case 'neutral':
            case 'immune':
                mem[memoryType] = [...new Set([...mem[memoryType], element])];
                if (memoryType === 'weak') {
                    mem.resist.filter(element => element !== element);
                    mem.immune.filter(element => element !== element);
                    mem.neutral.filter(element => element !== element);
                    console.log(`${this.name} remembers that ${t.name} is weak to ${element}`);
                } else if (memoryType === 'resist') {
                    mem.weak.filter(element => element !== element);
                    mem.immune.filter(element => element !== element);
                    mem.neutral.filter(element => element !== element);
                    console.log(`${this.name} remembers that ${t.name} is resistant to ${element}`);
                } else if (memoryType === 'immune') {
                    mem.weak.filter(element => element !== element);
                    mem.resist.filter(element => element !== element);
                    mem.neutral.filter(element => element !== element);
                    console.log(`${this.name} remembers that ${t.name} is immune to ${element}`);
                } else if (memoryType === 'neutral') {
                    mem.weak.filter(element => element !== element);
                    mem.resist.filter(element => element !== element);
                    mem.immune.filter(element => element !== element);
                    console.log(`${this.name} remembers that ${t.name} is neutral to ${element}`);
                }
                break;
            case 'attackedMe':
                mem.attackedMe = true;
                mem.usedAttackUids = [...new Set([...mem.usedAttackUids, action.uid])];
                console.log(`${this.name} remembers that ${t.name} attackedMe with ${action.name}`);
                break;
        }
    }
    get possibleOptions () {
        return [...this.skills, this.weapon, ...this.items.filter(item => !item.limit || item.limitCount > 0)];
    }
    checkOptions () {
        console.groupCollapsed(`checking ${this.name}'s turn options`);
        let chosenOption;
        const possibleOptions = this.possibleOptions;
        const newOptions = possibleOptions.filter(opt => !this.aiOptions.some(aiOpt => aiOpt.option.uid === opt.uid));
        if (newOptions.length > 0) {
            console.groupCollapsed(`creating newOptions for ${this.name}`);
            newOptions.forEach(option => {
                this.aiOptions.push(new AiOption(this, option));
            });
            console.groupEnd();
        }
        const invalidOptions = this.aiOptions.filter(aiOpt => !possibleOptions.some(opt => opt.uid === aiOpt.option.uid));
        invalidOptions.forEach(option => {
            option.valid = false;
        });
        const validateOptions = this.aiOptions.filter(aiOpt => possibleOptions.some(opt => opt.uid === aiOpt.option.uid));
        validateOptions.forEach(option => {
            option.valid = true;
        });
        let validOptions = this.aiOptions.filter(aiOpt => aiOpt.valid);
        if (validOptions.length === 0) { throw new Error(`${this.name} has no valid options!`); }
        validOptions.forEach(option => {
            option.checkWeight();
        });
        console.log('validOptions below:');
        console.log(deepClone(validOptions));
        if (validOptions.some(opt => !opt.valid)) {
            validOptions = validOptions.filter(opt => opt.valid);
            console.log('validOptions after removing newly invalid options below:');
            console.log(deepClone(validOptions));
        }
        if (validOptions.length === 0) {
            throw new Error('no valid action options!');
        } else if (validOptions.length === 1) {
            chosenOption = validOptions[0];
        } else {
            validOptions = validOptions.sort((a, b) => b.weight - a.weight);
            const totalWeight = validOptions[0].weight + validOptions[1].weight + (validOptions[2]?.weight ?? 0);
            const randomNumber = Math.floor(Math.random() * totalWeight);
            if (randomNumber <= validOptions[0].weight) {
                chosenOption = validOptions[0];
            } else if (randomNumber <= validOptions[0].weight + validOptions[1].weight) {
                chosenOption = validOptions[1];
            } else {
                chosenOption = validOptions[2];
            }
        }
        console.log(`chosenOption ${chosenOption.option.name} below:`);
        console.log(deepClone(chosenOption));
        if (!chosenOption.resetWeight) {
            chosenOption.weight = (Math.random() * 0.2);
        } else if (chosenOption.resetWeight) {
            console.log(`resetting ${this.name} aiOption ${chosenOption.option.name} weight to ${chosenOption.resetWeight}`);
            chosenOption.weight = chosenOption.resetWeight + (Math.random() * 0.2);
        }
        chosenOption.targetLogic();
        console.groupEnd();
        initiateResults(this, chosenOption.option);
    }
    get element () {
        function filterDuplicates (weak, resist, immune) {
            let dupeElements = weak.filter(element => resist.includes(element));
            dupeElements.forEach(element => {
                weak = weak.filter(weakness => weakness !== element);
                resist = resist.filter(resistance => resistance !== element);
            });
            let immuneElements = immune.filter(element => weak.includes(element) || resist.includes(element));
            immuneElements.forEach(element => {
                weak = weak.filter(weakness => weakness !== element);
                resist = resist.filter(resistance => resistance !== element);
            });
            weak = [...new Set(weak)];
            resist = [...new Set(resist)];
            immune = [...new Set(immune)];
        }

        //first take raw from char
        let weak = this._weak; //char is weak to element
        let resist = this._resist; //char resists element
        let immune = this._immune; //char resists element
        filterDuplicates(weak, resist, immune);

        console.log(`${this.name} this.mods:`);
        console.log(this.mods);

        //then apply modifiers
        console.log('about to check resistMods!');
        const resistMods = this.mods.filter(mod => mod.eff?.some(eff => eff.weak || eff.resist || eff.immune));
        if (resistMods) {
            console.log('resistMods below:');
            console.log(resistMods);
            resistMods.forEach(mod => {
                mod.eff.forEach(eff => {
                    weak = [...weak, ...eff.weak ?? []];
                    resist = [...resist, ...eff.resist ?? []];
                    immune = [...immune, ...eff.immune ?? []];
                });
                filterDuplicates(weak, resist, immune);
            });
        }

        console.log('about to check resistEffs!');
        console.log(this.currentEffs);
        //then apply triggered effs
        const resistEffs = this.currentEffs.filter(cEff => cEff.eff?.some(eff => eff.weak || eff.resist || eff.immune));
        if (resistEffs) {
            console.log('resistEffs below:');
            console.log(resistEffs);
            resistEffs.forEach(rEff => {
                rEff.eff.forEach(eff => {
                    weak = [...weak, ...eff.weak ?? []];
                    resist = [...resist, ...eff.resist ?? []];
                    immune = [...immune, ...eff.immune ?? []];
                });
                filterDuplicates(weak, resist, immune);
            });
        }
        return {weak: weak, resist: resist, immune: immune};
    }
    get skills () {
        let _skills = [...this.weapon.skills, ...this.armour.skills ?? [], ...this.accessory.skills ?? []];
        this.skillUidList.forEach(skillUid => {
            const skill = skills.find(skill => skill.uid === skillUid);
            _skills.push(skill);
        });
        return _skills;
    }
    get items () {
        let _items = [];
        this.itemUidList.forEach(uid => {
            const item = items.find(item => item.uid === uid);
            _items.push(item);
        });  
        return _items;
    }
    giveItem (source) {
        if (typeof source === 'string') {
            console.log(`Giving new item from itemId ${source}!`);
            const exItem = this.items.find(item => item.id === source && item.stock !== undefined);
            if (exItem) {
                console.log(`${exItem.id} found! Increase stock by 1.`);
                exItem.stock += 1;
            } else {
                const item = new ActThing(source, 'item');
                this.itemUidList.push(item.uid);
                console.log(`new item ${item.id} ${item.uid} given to ${this.name}`);
            }
        } else if (typeof source === 'object' && input !== null) {
            console.log(`Giving an existing item obj ${source.id}!`);
            const exChar = characters.filter(char => char.itemUidList.includes(source.uid));
            if (exChar.length === 1) {
                console.log(`removing existing item ${source.id} from ${exChar.name}`);
                exChar.takeItem(source, 'remove');
            } else if (exChar.length > 1) {
                throw new Error(`Somehow two characters owned ${source.name} ${source.uid} at the same time!`);
            }
            if (this.items.find(item => item.id === source.id && item.stock !== undefined)) {
                const exItem = this.items.find(item => item.id === source && item.stock !== undefined);
                if (exItem) {
                    console.log(`existing item ${itemId} found, increasing stock!`);
                    exItem.stock += 1;
                } else {
                    console.log(`non-stock item or no exItem found, create new`);
                    this.itemUidList.push(new ActThing(source, 'item').uid);
                }
            } else {
                this.itemUidList.push(new ActThing(source, 'item').uid);
            }
        } else {
            throw new Error(`No giveItem logic for item data type, or null given!`);
        }
        console.log(`${this.name} itemUidList below:`);
        console.log(deepClone(this.itemUidList));
    }
    takeItem (item, reason) {
        //reasons: consume, remove
        console.log(`takeItem ${item.id} ${item.uid} from ${this.name}`);
        console.log(deepClone(this.itemUidList));
        console.log(deepClone(item));
        const itemIndex = this.itemUidList.findIndex(uid => uid === item.uid);
        if (itemIndex === -1) {
            throw new Error(`${item.id} not found in ${this.name}'s itemUidList!`);
        } else {
            if (item.stock !== undefined) {
                item.stock -= 1;
                console.log(`${item.id}'s new stock is ${item.stock}`);
                if (item.stock <= 0) {
                    this.itemUidList.splice(itemIndex, 1);
                    console.log(`${this.name} itemUidList after splicing:`);
                    console.log(deepClone(this.itemUidList));
                }
            } else if (reason === 'remove') {
                console.log(`removing ${item.id} from ${c.name}`);
                this.itemUidList.splice(itemIndex, 1);
            } else if (item.limit && reason === 'consume') {
                item.limitCount += 1;
                if (item.limitCount >= item.limit) {
                    item.disabled = true;
                }
            }
        }
        console.log(`${this.name} itemUidList below:`);
        console.log(this.itemUidList);
        let ownedBy = characters.filter(char => char.itemUidList.includes(item.uid));
        if (ownedBy.length > 1) {
            throw new Error(`This item is owned by multiple chars!`);
        } else if (ownedBy.length === 0) {
            console.log(`No one owns this item! Delete it!`);
            const genIndex = items.findIndex(obj => obj.uid === item.uid);
            items.splice(genIndex, 1);
        }
    }
    get mods () {
        return modifiers.filter(mod => mod.targetUidList.includes(this.uid));
    }
    get currentEffs () {
        return currentEffs.filter(eff => eff.tUid === this.uid);
    }
    checkTriggers (eventTrigger, eventCategory) {
        console.groupCollapsed(`checking all modifier triggers!`);
        console.log(`${eventTrigger}, ${eventCategory.join(', ')}`);
        this.mods.forEach(mod => {
            if (!(mod.exhaustCount <= 0 || mod.expCount <= 0) && mod.triggerEff) {
                console.log(`checking ${mod.id} triggers`);
                for (let triggerEffIndex = 0; triggerEffIndex < mod.triggerEff.length; ++triggerEffIndex) {
                    const triggerEff = mod.triggerEff[triggerEffIndex];
                    if (!triggerEff.stacks) {
                        const existingEff = currentEffs.find(eff =>
                            eff.tUid === this.uid &&
                            eff.mUid === mod.uid &&
                            eff.triggerEffIndex === triggerEffIndex);
                        if (existingEff) {
                            console.log(`triggerEff can't stack and is already applied.`);
                            return;
                        }
                    }
                    if (triggerEff.trigger.includes(eventTrigger)) {
                        console.log(`trigger ${eventTrigger} found`);
                    } else {
                        console.log(`trigger ${eventTrigger} not found! INVALID`);
                        return;
                    }
                    if (triggerEff.category) {
                        console.log(`checking category for cat ${triggerEff.category.join(', ')}`);
                        if (triggerEff.category.some(cat => eventCategory.includes(cat))) {
                            console.log('trigger cat found');
                        } else {
                            console.log(`trigger cat not found! INVALID`);
                            return;
                        }
                    }
                    if (triggerEff.category2) {
                        console.log(`checking category for cat2 ${triggerEff.category2.join(', ')}`);
                        if (triggerEff.category2.some(cat => eventCategory.includes(cat))) {
                            console.log('trigger cat2 found');
                        } else {
                            console.log(`trigger cat2 not found! INVALID`);
                            return;
                        }
                    }
                    console.log(`new Effect created!`);
                    new Effect (mod, triggerEff, triggerEffIndex, this);
                }
            }
        });
        console.groupEnd();
    }
    get weapon () {
        return weapons.find(weapon => weapon.uid === this.weaponUid);
    }
    get armour () {
        return armours.find(armour => armour.uid === this.armourUid);
    }
    get accessory () {
        return accessorys.find(accessory => accessory.uid === this.accessoryUid);
    }
    get checkWeaponElement () { 
        const elementMods = this.mods.filter(mod => mod.eff?.some(eff => eff.weaponElement));
        const elementEffs = this.currentEffs.filter(eff => eff.weaponElement);
        if (!elementMods && !elementEffs) {
            console.log('no elementMods or elementEffs found, return checkWeaponElement false');
            return false;
        }
        let weaponElement;
        elementMods.forEach(mod => {
            const relevantEffs = mod.eff.filter(eff => eff.weaponElement);
            relevantEffs.forEach(eff => {
                weaponElement = eff.weaponElement;
            });
        });
        elementEffs.forEach(eff => {
            weaponElement = eff.weaponElement;
        });
        return weaponElement;
    }
    get name () {
        return (this.knownName ?? this.iteratedName ?? this._name);
    }
    get maxHp () {
        let _maxHp = this.baseHp + this.for;
        return _maxHp;
    }
    get currentHp () {
        return this._currentHp;
    }
    adjustHp (type, val) {
        val = Math.floor(val);
        if (type === 'heal') {
            this._currentHp = Math.min(this.maxHp, this._currentHp + val);
        } else if (type === 'damage') {
            this._currentHp = Math.max(0, this._currentHp - val);
            if (this._currentHp === 0) {
                this.dead = true;
                this.ready = false;
            }
        }
        updateStatbox();
    }
    get maxMp () {
        let _maxMp = Math.floor(this.baseMp + (this.wil * 0.5) + (this.int * 0.25) + (this.cha * 0.25));
        return _maxMp;
    }
    get currentMp () {
        return this._currentMp;
    }
    adjustMp (type, val) {
        if (type === 'heal') {
            this._currentMp = Math.min(this.maxMp, this._currentMp + val);
        } else if (type === 'damage') {
            this._currentMp = Math.max(0, this._currentMp - val);
        }
        updateStatbox();
    }
    get He () {
        switch (this.gen) {
            case 'f':
                return 'She';
            case 'm':
                return 'He';
            case 'n':
                return 'Ve';
            case 'it':
                return 'It';
        }
    }
    get he () {
        switch (this.gen) {
            case 'f':
                return 'she';
            case 'm':
                return 'he';
            case 'n':
                return 've';
            case 'it':
                return 'it';
        }
    }
    get Him () {
        switch (this.gen) {
            case 'f':
                return 'Her';
            case 'm':
                return 'Him';
            case 'n':
                return 'Ver';
            case 'it':
                return 'It';
        }
    }
    get him () {
        switch (this.gen) {
            case 'f':
                return 'her';
            case 'm':
                return 'him';
            case 'n':
                return 'ver';
            case 'it':
                return 'it';
        }
    }
    get His () {
        switch (this.gen) {
            case 'f':
                return 'Her';
            case 'm':
                return 'His';
            case 'n':
                return 'Vis';
            case 'it':
                return 'Its';
        }
    }
    get his () {
        switch (this.gen) {
            case 'f':
                return 'her';
            case 'm':
                return 'his';
            case 'n':
                return 'vis';
            case 'it':
                return 'its';
        }
    }
    get HisS () {
        switch (this.gen) {
            case 'f':
                return 'Hers';
            case 'm':
                return 'His';
            case 'n':
                return 'Vis';
            case 'it':
                return 'Its';
        }
    }
    get hisS () {
        switch (this.gen) {
            case 'f':
                return 'hers';
            case 'm':
                return 'his';
            case 'n':
                return 'vis';
            case 'it':
                return 'its';
        }
    }
    get Himself () {
        switch (this.gen) {
            case 'f':
                return 'Herself';
            case 'm':
                return 'Himself';
            case 'n':
                return 'Verself';
            case 'it':
                return 'Itself';
        }
    }
    get himself () {
        switch (this.gen) {
            case 'f':
                return 'herself';
            case 'm':
                return 'himself';
            case 'n':
                return 'verself';
            case 'it':
                return 'itself';
        }
    }
    get Man () {
        switch (this.gen) {
            case 'f':
                return 'Woman';
            case 'm':
                return 'Man';
            case 'n':
                return 'Person';
            case 'it':
                return `Creature`;
        }
    }
    get man () {
        switch (this.gen) {
            case 'f':
                return 'woman';
            case 'm':
                return 'man';
            case 'n':
                return 'person';
            case 'it':
                return `creature`;
        }
    }
    get Male () {
        switch (this.gen) {
            case 'f':
                return 'Female';
            case 'm':
                return 'Male';
            case 'n':
                return 'Nonbinary';
            case 'it':
                return `Creature`;
        }
    }
    get male () {
        switch (this.gen) {
            case 'f':
                return 'female';
            case 'm':
                return 'male';
            case 'n':
                return 'nonbinary';
            case 'it':
                return `creature`;
        }
    }
}

//add chainskill support as a get that selects by index reference
class ActThing extends Thing {
    constructor (id, thingType) {
        super(id, thingType);
        let cloneThing;
        switch (thingType) {
            case 'skill':
                cloneThing = deepClone(baseSkill[id]);
                skills.push(this);
                break;
            case 'weapon':
                cloneThing = deepClone(baseWeapon[id]);
                weapons.push(this);
                break;
            case 'armour':
                cloneThing = deepClone(baseArmour[id]);
                armours.push(this);
                break;
            case 'accessory':
                cloneThing = deepClone(baseAccessory[id]);
                accessorys.push(this);
                break;
            case 'item':
                cloneThing = deepClone(baseItem[id]);
                items.push(this);
                break;
        }
        if (!cloneThing) {
            throw new Error(`cloneThing matching ${id} not found!`);
        }
        Object.assign(this, cloneThing);
        if (this.thingType === 'armour') {
            this.mUid = new Modifier(this).uid;
        } else if (this.thingType === 'accessory') {
            this.mUid = new Modifier(this).uid;
        } else if (this.thingType === 'item') {
            if (!this.unlimited && !this.limit) {
                this.stock = this.stock ?? 1;
            }
        }
        this.category = [...new Set([...(this.category ?? []), thingType])];

        //if this is equipment, create skills from defaultSkillId and getter skills ()
        if ((thingType === 'weapon') || thingType === 'armour' || thingType === 'accessory') {
            this.skillUidList = [];
            cloneThing.defaultSkill?.forEach(skillId => {
                const skill = new ActThing (skillId, 'skill', this);
                this.skillUidList.push(skill.uid);
            });
            Object.defineProperty(this, 'skills', {
                get() {
                    let _skills = [];
                    this.skillUidList.forEach(skillUid => {
                        const skill = skills.find(skill => skill.uid === skillUid);
                        _skills.push(skill);
                    });
                    return _skills;
                }
            });
        }

        for (let actIndex = 0; actIndex < this.action?.length; ++actIndex) {
            const act = this.action[actIndex];
            act.category = (act.category ?? []);
            if (this.category.includes('weaponSkill')) {
                act.category = [...new Set([...act.category, 'weaponSkill'])];
            }
            if (actIndex > 0 && !act.target) { act.target = 'prevSuccess'; }
            switch (act.actFn) {
                case 'attack':
                    if (actIndex === 0 && !this.selectTarget) { this.selectTarget = 'enemySingle'; }
                    if (!act.element && actIndex === 0) { act.element = 'phys'; }
                    else if (!act.element && actIndex > 0) {
                        const lastAct = this.action.slice().reverse().find(rAct => rAct.element);
                        if (lastAct) { act.element = lastAct.element; }
                        else { act.element = 'phys'; }
                    }
                    if (!act.attackType && actIndex === 0) { act.attackType = 'melee'; }
                    else if (!act.attackType && actIndex > 0) {
                        const lastAct = this.action.slice().reverse().find(rAct => rAct.attackType);
                        if (lastAct) { act.attackType = lastAct.attackType; }
                        else { act.attackType = 'melee'; }
                    }
                    act.accuracy = (act.accuracy ?? 100);
                    act.damage = (act.damage ?? 0);
                    act.critChance = (act.critChance ?? 5);
                    act.critMultiplier = (act.critMultiplier ?? 1.5);
                    act.conDamage = (act.conDamage ?? 1);
                    switch (act.attackType) {
                        case 'melee':
                            act.statAcc = (act.statAcc ?? 'agi');
                            act.statDam = (act.statDam ?? 'str');
                            act.statDodge = (act.statDodge ?? 'agi');
                            act.statDef = (act.statDef ?? 'for');
                            break;
                        case 'ranged':
                            act.statAcc = (act.statAcc ?? 'agi');
                            act.statDam = (act.statDam ?? 'agi');
                            act.statDodge = (act.statDodge ?? 'agi');
                            act.statDef = (act.statDef ?? 'for');
                            break;
                        case 'social':
                            act.statAcc = (act.statAcc ?? 'cha');
                            act.statDam = (act.statDam ?? 'cha');
                            act.statDodge = (act.statDodge ?? 'cha');
                            act.statDef = (act.statDef ?? 'wil');
                            break;
                        case 'magicMat':
                            act.statAcc = (act.statAcc ?? 'int');
                            act.statDam = (act.statDam ?? 'int');
                            act.statDodge = (act.statDodge ?? 'agi');
                            act.statDef = (act.statDef ?? 'for');
                            act.category.push('magic');
                            break;              
                        case 'magicMen':
                            act.statAcc = (act.statAcc ?? 'int');
                            act.statDam = (act.statDam ?? 'int');
                            act.statDodge = (act.statDodge ?? 'int');
                            act.statDef = (act.statDef ?? 'wil');
                            act.category.push('magic');
                            break;
                        case 'divineMat':
                            act.statAcc = (act.statAcc ?? 'cha');
                            act.statDam = (act.statDam ?? 'cha');
                            act.statDodge = (act.statDodge ?? 'agi');
                            act.statDef = (act.statDef ?? 'for');
                            act.category.push('divine');
                            break;              
                        case 'divineMen':
                            act.statAcc = (act.statAcc ?? 'cha');
                            act.statDam = (act.statDam ?? 'cha');
                            act.statDodge = (act.statDodge ?? 'cha');
                            act.statDef = (act.statDef ?? 'wil');
                            act.category.push('divine');
                            break;
                    }
                    this.category = [...new Set([...this.category, act.element, act.attackType])];
                    act.category = [...new Set([...act.category, act.element, act.attackType, thingType])];
                    break;
                case 'modify':
                    if (actIndex === 0 && !this.selectTarget) {
                        this.selectTarget = 'allySingle';
                    }
                    const mod = act.modifier;
                    if (mod.onePerC || mod.onePerId && !mod.remodify) {
                        mod.remodify = 'replace';
                    }
                    break;
            }
        }
    }
    get mod () {
        switch (this.thingType) {
            case 'armour':
                return modifiers.find(mod => mod.uid === this.mUid);
            case 'accessory':
                return modifiers.find(mod => mod.uid === this.mUid);
        }
        return undefined;
    }
}

function checkExpire (time, c) {
    if (modifiers.length) {
        console.groupCollapsed(`running checkExpire function for all modifiers, time ${time}`);
        if (c) { console.log(`c ${c.name} ${time}`); }
        for (let i = modifiers.length - 1; i >= 0; --i) {
            modifiers[i].checkExpire(time, c);
        }
        console.groupEnd();
    }
}

function checkEffExpire (time) {
    for (let i = currentEffs.length - 1; i >= 0; --i) {
        let currentEff = currentEffs[i];
        let expire = false;
        switch (time) {
            case 'turn':
                if (currentEff.duration !== 'permanent') { expire = true; }
                break;
            case 'act':
                if (currentEff.duration === 'act') { expire = true; }
                break;
            case 'target':
                if (currentEff.duration === 'target') { expire = true; }
                break;
        }
        if (expire) { currentEffs.splice(i, 1); }
    }
}

function modTimeFn (time, c) {
    modifiers.forEach(mod => {
        switch (time) {
            case 'turnStart':
                if (mod.tTurnStart && mod.targetUidList.includes(c.uid)) { mod.tTurnStart(c); }
                if (mod.cTurnStart && mod.cUid === c.uid) { mod.cTurnStart(c); }
                if (mod.turnStart) { mod.turnStart(c); }
                break;
            case 'turnEnd':
                if (mod.tTurnEnd && mod.targetUidList.includes(c.uid)) { mod.tTurnEnd(c); }
                if (mod.cTurnEnd && mod.cUid === c.uid) { mod.cTurnEnd(c); }
                if (mod.turnEnd) { mod.turnEnd(c); }
                break;
            case 'round':
                if (mod.round) { mod.round(); }
        }
    });
}

const baseCharacter = {
    pc: {
        name: 'Player',
        nameList: {
            m: ['Ezekiel', 'Erasmus', 'Bartholomew', 'Jansen', 'Frederick'],
            f: ['Rebecca', 'Aster', 'Tiffany', 'Serena', 'Francine'],
            n: ['Olive', 'Jay', 'Chase', 'Alex', 'Blake']
        },
        canTalk: true,
        initiative: 20,
        baseHp: 50,
        str: 40,
        agi: 40,
        for: 40,
        int: 40,
        cha: 40,
        wil: 40,
        defaultWeapon: ['jokeBook'],
        defaultArmour: ['leatherArmour', 'ironArmour'],
        defaultSkill: ['rampage', 'chainLightning'],
        defaultItem: ['potion', 'potion']
    },
    ant: {
        name: 'Ant',
        nameList: {
            f: ['Aspertum', 'Guardel', 'Kilfum', 'Heustum', 'Mastrum', 'Leveracter', 'Screnvendel', 'Skadalel', 'Massacter']
        },
        gen: 'f',
        baseHp: 50,
        str: 40,
        agi: 40,
        for: 40,
        int: 40,
        cha: 40,
        wil: 40,
        weak: ['fire'],
        resist: ['elec'],
        defaultWeapon: ['antBite'],
        defaultSkill: ['chainLightning', 'rampage', 'strengthen', 'warCry', 'venomBite', 'healingTouch']
    },
    merc: {
        name: 'Mercenary',
        nameList: {
            m: ['Marcus', 'Daniel', 'Connor', 'Shaun', 'Frank'],
            f: ['Susan', 'Jessica', 'Imogen', 'Marcine', 'Faith'],
            n: ['Sky', 'Avery', 'Taylor', 'Aspen', 'Rowan']
        },
        canTalk: true,
        baseHp: 40,
        str: 48,
        agi: 42,
        for: 45,
        int: 35,
        cha: 37,
        wil: 39,
        defaultWeapon: ['spear', 'shortsword'],
        defaultSkill: ['warCry', 'salve', 'glare'],
        defaultArmour: ['leatherArmour', 'ironArmour', 'blacksmithApron', 'bladesmithApron'],
        defaultItem: ['potion']

    },
    malandro: {
        name: 'Malandro',
        nameList: {
            m: ['Lucas', 'Mark', 'Gabriel', 'Louis', 'Bernard']
        },
        gen: 'm',
        canTalk: true,
        baseHp: 35,
        str: 41,
        agi: 46,
        for: 38,
        int: 44,
        cha: 44,
        wil: 38,
        defaultWeapon: ['razor'],
        defaultSkill: ['malandragem', 'beguile', 'doubleKick'],
        defaultArmour: ['leatherArmour'],
        defaultItem: ['adrenalinePill', 'potion']
    },
    capoierista: {
        name: 'Capoierista',
        nameList: {
            m: ['Enzo', 'Phillip', 'Francisco', 'Ignacio', 'Casper'],
            f: ['Adriana', 'Maria', 'Alice', 'Isabelle', 'Sophia'],
            n: ['Luca', 'Emili', 'Leo', 'Faren', 'Jesse']
        },
        baseHp: 40,
        str: 44,
        agi: 47,
        for: 44,
        int: 40,
        cha: 40,
        wil: 40,
        defaultWeapon: ['kick', 'razor'],
        defaultSkill: ['ginga', 'crescentKick', 'doubleKick', 'malandragem', 'armadaKick', 'negativa'],
        defaultArmour: ['leatherArmour', 'lightClothes'],
        defaultItem: ['guaranaTea', 'potion'],
        defaultAccessory: ['initiateCord']
    },
    wolf: {
        name: 'Wolf',
        aiPersonality: 'attacker',
        creature: true,
        baseHp: 25,
        str: 46,
        agi: 50,
        for: 40,
        int: 28,
        cha: 38,
        wil: 40,
        resist: ['mind'],
        defaultWeapon: ['bite'],
        defaultArmour: ['wolfPelt'],
        defaultSkill: ['howl', 'sneer', 'savage']
    },
    mercLeader: {
        talkId: 'merc',
        name: 'Mercenary Leader',
        nameList: {
            m: ['Marcus', 'Daniel', 'Connor', 'Shaun', 'Frank'],
            f: ['Susan', 'Jessica', 'Imogen', 'Shelley', 'Patricia'],
            n: ['Sky', 'Avery', 'Taylor', 'Aspen', 'Rowan']
        },
        canTalk: true,
        baseHp: 40,
        str: 50,
        agi: 44,
        for: 45,
        int: 37,
        cha: 39,
        wil: 45,
        defaultWeapon: ['stunBaton'],
        defaultSkill: ['coordinate', 'throwBomb'],
        defaultArmour: ['leatherArmour', 'ironArmour'],
        defaultItem: ['potion']
    },
    blueShaman: {
        name: 'Blue Shaman',
        nameList: {
            m: ['Azaphel', 'Melor', 'Aspect', 'Ganga', 'Michael'],
            f: ['Midge', 'Mildred', 'Holly', 'Jovia', 'Saturna'],
            n: ['Ash', 'Laurel', 'Midge', 'Boulder', 'Jovia']
        },
        canTalk: true,
        baseHp: 35,
        str: 36,
        agi: 39,
        for: 37,
        int: 46,
        cha: 48,
        wil: 43,
        weak: ['elec'],
        defaultWeapon: ['sapphireStaff'],
        defaultSkill: ['rainDance', 'slipstream', 'netafim'],
        defaultArmour: ['wizardRobes'],
        defaultItem: ['potion']
    },
    rAngel: {
        name: 'Angel',
        creature: true,
        baseHp: 30,
        str: 40,
        agi: 40,
        for: 38,
        int: 39,
        cha: 45,
        wil: 39,
        weak: ['dark'],
        resist: ['light'],
        defaultWeapon: ['angelicSmile'],
        defaultArmour: ['angelSkin'],
        defaultSkill: ['phenomena', 'healingTouch', 'message']
    },
    rArchangel: {
        name: 'Archangel',
        creature: true,
        baseHp: 40,
        str: 41,
        agi: 41,
        for: 42,
        int: 40,
        cha: 44,
        wil: 46,
        resist: ['light'],
        defaultWeapon: ['holyRod'],
        defaultArmour: ['glowingRaiments'],
        defaultSkill: ['resplendence', 'rainbow', 'message', 'coordinate']
    },
    imp: {
        name: 'Imp',
        creature: true,
        baseHp: 25,
        str: 32,
        agi: 45,
        for: 37,
        int: 49,
        cha: 48,
        wil: 36,
        resist: ['dark'],
        weak: ['light'],
        defaultWeapon: ['impClaws'],
        defaultArmour: ['impSkin'],
        defaultSkill: ['apocrypha', 'sap', 'soulrot', 'nadir']
    },
    littleDevil: {
        name: 'Little Devil',
        creature: true,
        baseHp: 20,
        str: 35,
        agi: 49,
        for: 36,
        int: 48,
        cha: 49,
        wil: 33,
        resist: ['dark'],
        weak: ['light'],
        defaultWeapon: ['fork'],
        defaultArmour: ['rags'],
        defaultSkill: ['tempt', 'apocrypha', 'soulrot', 'newMoon']
    },
    sambista: {
        name: 'Sambista',
        baseHp: 50,
        str: 40,
        agi: 48,
        for: 40,
        int: 41,
        cha: 50,
        wil: 52,
        defaultSkill: ['ginga', 'beguile'],
        defaultWeapon: ['agogo', 'pandeiro'],
        defaultArmour: ['lightClothes', 'leatherArmour'],
    }
};
//
// 
const baseWeapon = {
    razor: {
        name: 'Razor',
        aiType: 'attackBasic',
        descMenu: `A straight razor made of steel.`,
        selectTarget: 'enemySingle',
        action: [
            {actFn: 'attack',
                textSuccess: function (c, t) { return `${c.name} slashes ${t.name} with a razor.`; },
                damage: 7,
                damageP: 17,
                accuracy: 90,
                critChance: 34,
                critMultiplier: 1.34
            }
        ]
    },
    sapphireStaff: {
        aiType: 'attackBasic',
        name: 'Sapphire Staff',
        descMenu: 'A finely crafted wooden staff tipped with a sapphire.',
        defaultSkill: ['torrent'],
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} pummels ${t.name} with the blunt end of ${c.his} staff.`},
                damageP: 17,
                damage: 5
            }
        ],
    },
    holyRod: {
        aiType: 'attackBasic',
        name: 'Holy Rod',
        descMenu: 'An intricate rod of unknown metal, glowing brightly.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} beats ${t.name} with ${c.his} holy rod.`},
                element: 'light',
                damageP: 17,
                damage: 5
            }
        ],
    },
    stunBaton: {
        aiType: 'attackBasic',
        name: 'Stun Baton',
        descMenu: 'A metal rod tipped with aspected topaz. Crackles with energy.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} zaps ${t.name} with ${c.his} stun baton.`},
                element: 'elec',
                damageP: 17,
                damage: 7,
                conDamage: 2
            }
        ],
    },
    fist: {
        aiType: 'attackBasic',
        category: ['unarmed'],
        name: 'Fist',
        descMenu: 'Your hands.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} punches ${t.name}.`},
                damageP: 17,
                damage: 4
            }
        ]
    },
    kick: {
        aiType: 'attackBasic',
        category: ['unarmed', 'kick'],
        name: 'Kick',
        descMenu: 'Kick an enemy.',
        action: [
            {actFn: 'attack',
                category: ['unarmed', 'kick'],
                textSuccess: function (c,t) { return `${c.name} kicks ${t.name}.` },
                textMiss: function (c,t) { return `${c.name} kicks at ${t.name} but misses.`; },
                accuracy: 85,
                damageP: 20,
                damage: 6,
                critChance: 15,
                conDamage: 1.25
            }
        ]
    },
    impClaws: {
        aiType: 'attackBasic',
        aiPref: 'backupAttack',
        name: 'Imp Claws',
        descMenu: 'Gnarled and jagged claws.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} scratches ${t.name} with ${c.his} claws.`},
                damageP: 20,
                damage: 5,
                critChance: 50,
                critMultiplier: 1.34,
                conDamage: 1.5
            }
        ]
    },
    fork: {
        aiType: 'attackBasic',
        aiPref: 'backupAttack',
        name: 'Fork',
        descMenu: 'A small three-pronged weapon made of unknown metal.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} stabs ${t.name} with ${c.his} fork.`},
                textMiss: function (c, t) {return `${c.name} tries to stab ${t.name} but misses.`},
                accuracy: 90,
                damageP: 17,
                damage: 6,
                critChance: 50,
                critMultiplier: 1.34,
            },
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} stabs ${t.name} again!`},
                textMiss: function (c, t) {return `${c.name} stabs at ${t.name} again but misses.`},
                accuracy: 80,
                damageP: 17,
                damage: 6,
                critChance: 50,
                critMultiplier: 1.34,
            }
        ]
    },
    bite: {
        aiType: 'attackBasic',
        name: 'Bite',
        descMenu: 'Chomp on an enemy.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} bites ${t.name}.`},
                accuracy: 90,
                damageP: 22,
                damage: 4
            }
        ]
    },
    spear: {
        aiType: 'attackBasic',
        name: 'Spear',
        descMenu: 'A basic spear with a wooden shaft and iron tip.',
        selectTarget: 'enemySingle',
        defaultSkill: ['lunge'],
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} strikes ${t.name}.`},
                accuracy: 95,
                damageP: 20,
                damage: 5,
                critChance: 10
            }
        ]
    },
    shortsword: {
        aiType: 'attackBasic',
        name: 'Shortsword',
        descMenu: 'A basic shortsword with an iron blade.',
        selectTarget: 'enemySingle',
        defaultSkill: ['wildSwing'],
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} slashes ${t.name}.`},
                accuracy: 95,
                damageP: 17,
                damage: 6
            }
        ]
    },
    jokeBook: {
        aiType: 'attackBasic',
        name: 'Joke Book',
        descMenu: `A book of jokes for children.<br>On hit, improves enemy sentiment.<br>Critical hits inflict 'Laughing'.`,
        selectTarget: 'enemySingle',
        defaultSkill: ['mock', 'shareJoke'],
        action: [
            {actFn: 'attack',
                attackType: 'social',
                textSuccess: function (c,t) {
                    t.sentiment += 1;
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a childish joke.` }},
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a joke about a horse and a tailor.` }},
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a joke about a dog walking into tavern.` }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                textMiss: function (c, t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a childish joke but ${t.he} doesn't laugh.` }},
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a joke about a horse and a tailor but ${t.he} doesn't laugh.` }},
                        {textFn: function (c, t) { return `${c.name} tells ${t.name} a joke about a dog walking into tavern but ${t.he} doesn't laugh.` }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                element: 'mind',
                accuracy: 95,
                damageP: 17,
                damage: 4,
                critChance: 45,
                critMultiplier: 1.34,
                conDamage: 2
            },
            {actFn: 'modify',
                target: 'prevCritical',
                textSuccess: function (c,t) {
                    return `${t.name} starts laughing.<br>Lasts one turn. (-<u>accuracy</u>, -<u>dodge</u>)`;
                },
                modifier: {
                    id: 'joke',
                    onePerId: 'target',
                    descriptor: 'Laughing',
                    expCount: 1,
                    expTime: 'tTurnEnd',
                    tTurnStart: function (c) {
                        createMessage('char', `${c.name} is laughing.`, c);
                    },
                    eff: [
                        {stat: 'accuracyM', multi: 0.80},
                        {stat: 'dodgeM', multi: 0.80}
                    ]
                }
            }
        ]
    },
    angelicSmile: {
        aiType: 'attackBasic',
        name: 'Angelic Smile',
        descMenu: 'A smile like a ray of sunlight.<br>The target is weak to the next light attack.',
        selectTarget: 'enemySingle',
        defaultSkill: ['wickedGrin'],
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} smiles sweetly, brightening ${t.name}'s day.`},
                attackType: 'social',
                element: 'light',
                damageP: 17,
                damage: 4
            },
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${t.name} is weak to the next light attack!`; },
                modifier: {
                    id: 'smile',
                    onePerId: 'target',
                    descriptor: 'Smile',
                    exhaustCount: 1,
                    triggerEff: [
                        {trigger: ['attackT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name}'s heart is touched by grace. (+<u>weak to light</u>)`, c);
                            },
                            category: ['light'],
                            eff: [
                                {weak: ['light']}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    agogo: {
        aiType: 'attackRandom',
        category: ['instrument'],
        name: 'Agogo Bells',
        descMenu: 'An instrument. Two metal bells joined by a U-shaped handle.',
        selectTarget: 'enemyRandom',
        defaultSkill: ['percussion'],
        action: [
            {actFn: 'attack',
                category: ['instrument'],
                attackType: 'social',
                element: 'mind',
                textSuccess: function (c, t) {return `${t.name} is hurt by a piercing note.`},
                textMiss: function (c, t) {return `${t.name} is unaffected by the clanging bells.`},
                accuracy: 80,
                damageP: 20,
                damge: 9
            },
            {actFn: 'modify',
                target: 'yourself',
                textSuccess: function (c, t) {return `${c.name} is moving to the beat!`},
                modifier: {
                    id: 'rhythm',
                    expTime: 'cTurnEnd',
                    expCount: 2,
                    descriptor: 'Rhythm',
                    eff: [
                        {stat: 'agi', val: 2},
                        {stat: 'dodgeM', multi: 1.05}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            category: ['instrument'],
                            eff: [
                                {stat: 'accuracy', val: 5}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    pandeiro: {
        aiType: 'attackRandom',
        category: ['instrument'],
        name: 'Pandeiro',
        descMenu: 'An instrument also known as a tambourine. A handheld drum with metal jingles around the rim.',
        selectTarget: 'enemyRandom',
        defaultSkill: ['percussion'],
        action: [
            {actFn: 'attack',
                category: ['instrument'],
                attackType: 'social',
                element: 'mind',
                randomMin: 2,
                randomMax: 3,
                targetRepeat: false,
                textSuccess: function (c, t) {return `${t.name} is struck by the beat.`},
                textMiss: function (c, t) {return `${t.name} isn't affected.`},
                accuracy: 80,
                damageP: 20,
                damage: 5,
                conDamage: 0.5
            },
            {actFn: 'modify',
                target: 'yourself',
                expTime: 'cTurnEnd',
                expCount: 1,
                textSuccess: function (c, t) {return `${c.name} is moving to the beat!`},
                modifier: {
                    id: 'rhythm',
                    descriptor: 'Rhythm',
                    expTime: 'cTurnEnd',
                    expCount: 2,
                    eff: [
                        {stat: 'agi', val: 2},
                        {stat: 'dodgeM', multi: 1.05}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            category: ['instrument'],
                            eff: [
                                {stat: 'accuracy', val: 5}
                            ]
                        }
                    ]
                }
            }
        ]
    }
};

const baseAccessory = {
    noAccessory: {
        name: 'No Accessory',
        descMenu: 'No accessory.'
    },
    initiateCord: {
        name: 'Initiate Cord',
        descMenu: 'A yellow cord worn by initiates in the martial art capoiera.',
        triggerEff: [
            {trigger: ['attack'],
                category: ['unarmed'],
                eff: [
                    {stat: 'accuracy', val: 5}
                ]
            }
        ]
    }
};

const baseArmour = {
    noArmour: {
        name: 'No Armour',
        descMenu: 'No armour.'
    },
    bladesmithApron: {
        name: `Bladesmith's Apron`,
        descMenu: `A bladesmith's apron fitted with tools for sharpening weapons.`,
        defaultSkill: ['sharpen'],
        eff: [
            {stat: 'defence', val: 2},
            {stat: 'dodge', val: -2}
        ]
    },
    blacksmithApron: {
        name: `Blacksmith's Apron`,
        descMenu: `A blacksmith's apron full of tools for maintaining armour.`,
        defaultSkill: ['polish'],
        eff: [
            {stat: 'defence', val: 2},
            {stat: 'dodge', val: -2}
        ]
    },
    ironArmour: {
        name: 'Iron Armour',
        descMenu: 'A suit of iron armour.',
        eff: [
            {stat: 'defence', val: 4},
            {stat: 'defenceM', multi: 1.05},
            {stat: 'dodge', val: -4}
        ]
    },
    leatherArmour: {
        name: 'Leather Armour',
        descMenu: 'A suit of leather armour.',
        eff: [
            {stat: 'defence', val: 3},
            {stat: 'dodge', val: -1}
        ]
    },
    rubberSuit: {
        name: 'Rubber Suit',
        descMenu: 'A suit of rubber. Grants electric resistance.',
        eff: [
            {resist: ['elec']},
            {stat: 'defence', val: 2},
            {stat: 'dodge', val: -2}
        ]
    },
    wizardRobes: {
        name: 'Wizard Robes',
        descMenu: 'Wizard robes inscribed with magic runes.',
        eff: [
            {stat: 'defence', val: 1}
        ],
        triggerEff: [
            {trigger: ['attack'],
                category: ['magic'],
                eff: [
                    {stat: 'accuracy', val: 5},
                    {stat: 'damage', val: 1}
                ]
            },
            {trigger: ['attackT'],
                category: ['magic'],
                eff: [
                    {stat: 'dodge', val: 2},
                    {stat: 'defence', val: 1}
                ]
            }
        ]
    },
    glowingRaiments: {
        name: 'Glowing Raiments',
        descMenu: 'Angelic priestly attire woven from self-illuminating fabrics.',
        eff: [
            {stat: 'defence', val: 1}
        ],
        triggerEff: [
            {trigger: ['attack'],
                category: ['light'],
                eff: [
                    {stat: 'accuracy', val: 2},
                    {stat: 'damage', val: 2}
                ]
            },
            {trigger: ['attackT'],
                category: ['light'],
                eff: [
                    {stat: 'dodge', val: 2},
                    {stat: 'defence', val: 2}
                ]
            }
        ]
    },
    wolfPelt: {
        name: 'Wolf Pelt',
        descMenu: `A wolf's furry coat.`,
        eff: [
            {stat: 'str', val: 1},
            {stat: 'dodge', val: 1}
        ]
    },
    lightClothes: {
        name: 'Light Clothes',
        descMenu: `Simple clothes that don't encumber movement.`,
        eff: [
            {stat: 'dodge', val: 3}
        ], 
        triggerEff: [
            {trigger: ['attack'],
                category: ['unarmed'],
                eff: [
                    {stat: 'accuracy', val: 3}
                ]
            }
        ]
    },
    rags: {
        name: 'Rags',
        descMenu: `Thin dirty rags.`,
        eff: [
            {stat: 'cha', val: -3},
            {stat: 'dodge', val: 5}
        ], 
        triggerEff: [
            {trigger: ['attack'],
                category: ['melee'],
                eff: [
                    {stat: 'accuracy', val: 3}
                ]
            },
            {trigger: ['attack'],
                category: ['dark'],
                eff: [
                    {stat: 'cha', val: 3}
                ]
            }
        ]
    },
    angelSkin: {
        name: 'Angel Skin',
        descMenu: 'The skin of an angel. Shimmers in sunlight.',
        eff: [
            {stat: 'cha', val: 1},
            {stat: 'dodge', val: 1}
        ]
    },
    impSkin: {
        name: 'Imp Skin',
        descMenu: 'The skin of an imp. It has a strange filmy texture.',
        triggerEff: [
            {trigger: ['attackT'],
                category: ['melee', 'unarmed'],
                triggerFn: function (c) {
                    if (c.id === 'imp') {
                        createMessage('char', `${c.name}'s skin is slippery!`, c);
                    } else {
                        createMessage('char', `${c.name}'s Imp Skin is slippery!`, c);
                    }     
                },
                eff: [
                    {stat: 'dodge', val: 12},
                    {stat: 'defence', val: 2}
                ]
            }
        ]
    }
};

const genericSkill = {
    focus: {
        name: 'Focus',
        descMenu: 'Focus until the end of your next turn, increasing accuracy, dodge, defence, and damage.',
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${c.name} is focused.`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Focus',
                    expTime: 'cTurnEnd',
                    expCount: 2,
                    eff: [
                        {stat: 'accuracyM', multi: 1.34},
                        {stat: 'damageM', multi: 1.34},
                        {stat: 'dodgeM', multi: 1.1},
                        {stat: 'defenceM', multi: 1.1}
                    ]
                }
            }
        ]  
    },
    defend: {
        name: 'Defend',
        descMenu: 'Increase your dodge and defence until the start of your next turn.',
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${c.name} is defending ${c.himself}.`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Defend',
                    expTime: 'cTurnStart',
                    expCount: 1,
                    eff: [
                        {stat: 'dodgeM', multi: 1.34},
                        {stat: 'defenceM', multi: 1.34}
                    ],
                    triggerEff: [
                        {trigger: ['attackT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is defending ${c.himself}.<br>(+<u>dodge</u>, +<u>defence</u>)`, c);
                            }
                        }
                    ]
                }
            }
        ]  
    }
};

const baseSkill = {
    percussion: {
        name: 'Percussion',
        aiType: 'attackBasic',
        category: ['instrument'],
        selectTarget: 'enemySingle',
        descMenu: 'Strike with a strong percussive beat. Invigorates you and your allies.',
        action: [
            {actFn: 'attack',
                category: ['instrument'],
                attackType: 'social',
                element: 'mind',
                textSuccess: function (c, t) {return `${t.name} is hit with a percussive beat.`},
                textMiss: function (c, t) {return `${t.name} isn't affected.`},
                accuracy: 85,
                damageP: 20,
                damage: 5,
                stopAction: 'miss',
                critChance: 10
            },
            {actFn: 'modify',
                target: 'allyTeam',
                textAct: function (c) {
                    const allyMap = targetTeam(c, 'ally').map(ally => ally.name);
                    let output = stringFn.commaAnd(allyMap);
                    if (allyMap.length === 1) {
                        output += ` is stepping to the beat!`;
                    } else {
                        output += ` are stepping to the beat!`;
                    }
                    return output;
                },
                modifier: {
                    id: 'percussion',
                    expTime: 'cTurnEnd',
                    expCount: 2,
                    descriptor: 'Percussion',
                    eff: [
                        {stat: 'str', val: 3},
                        {stat: 'agi', val: 3}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            category: ['instrument'],
                            eff: [
                                {stat: 'accuracy', val: 5},
                                {stat: 'damage', val: 2}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    sap: {
        aiType: 'attackBasic',
        aiReq: 'selfNotHealthy',
        name: 'Sap',
        descMenu: `Drain an enemy's life force.`,
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textSuccess: function (c,t) { return `${c.name} siphons ${t.name}'s life force.`; },
                textMiss: function (c,t) { return `${c.name} tries to steal ${t.name}'s life force, but fails.`; },
                element: 'dark',
                accuracy: 85,
                damageP: 17,
                damage: 3,
                stopAction: 'miss'
            },
            {actFn: 'heal',
                target: 'yourself',
                textAct: function (c) {
                    const log = combatHistory.find(log => log.round === round && log.turn === turn && log.actIndex === 0);
                    this.heal = Math.floor(log.context.damageDealt / 2 + 0.5);
                    return ``;
                },
                textSuccess: function (c,t) { return `${c.name} is rejuvenated.`; }
            }
        ]
    },
    nadir: {
        aiType: 'debuffEnemy',
        name: 'Nadir',
        descMenu: `Bring an enemy to an emotional low..`,
        selectTarget: 'enemySingle',
        selectOther: true,
        action: [
            {actFn: 'modify',
                textAct: function (c) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${t.name} is overcome with guilt, but ${t.he} doesn't know why.`; }},
                        {textFn: function (c, t) { return `${t.name} suddenly feels terribly lonely.`; }},
                        {textFn: function (c, t) { return `${t.name} is losing hope.`; }},
                        {textFn: function (c, t) { return `${t.name} is inexplicably wracked by grief.`; }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return `${resultOptions[random].textFn(c, this.targetList[0])}`;
                },
                textSuccess: function (c, t) { return `Lasts two turns. (-<u>damage</u>, -<u>heal power</u>)`; },
                modifier: {
                    id: 'nadir',
                    onePerId: 'target',
                    descriptor: 'Nadir',
                    expCount: 2,
                    expTime: 'tTurnEnd',
                    tTurnStart: function (c) {
                        if (c.team === 'ally') {
                            createMessage('char', `${c.name} is feeling low.`, c)
                        }
                    },
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) { createMessage('char', `${c.name} is feeling low.`, c); },
                            eff: [
                                {stat: 'damageM', multi: 0.5}
                            ]
                        },
                        {trigger: ['heal'],
                            triggerFn: function (c) { createMessage('char', `${c.name} is feeling low.`, c); },
                            eff: [
                                {stat: 'healTargetM', multi: 0.5}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    tempt: {
        aiType: 'attackBasic',
        name: 'Tempt',
        descMenu: `Plant the seeds of corruption in the target's mind.<br>The target is weak to the next dark attack.`,
        selectTarget: 'enemySingle',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name}: "Oh~ baby! I could guide you to riches!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "I could multiply your money, you know."`; }},
                        {textFn: function (c, t) { return `${c.name}: "I have an exciting investment opportunity just for you!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "Nobody understands commerce better than me!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "We could be friends! You and me against the world!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "I can turn lead into gold! Just cover the cost of the lead!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "Oh~ baby! There's something about you! You're special!"`; }},
                        {textFn: function (c, t) { return `${c.name}: "You're not like the others. You're different."`; }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return `${resultOptions[random].textFn(c,t)}`;
                },
                attackType: 'social',
                element: 'dark',
                damageP: 17,
                damage: 4
            },
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${t.name} is weak to the next dark attack!`; },
                modifier: {
                    id: 'tempt',
                    onePerId: 'target',
                    descriptor: 'Tempt',
                    exhaustCount: 1,
                    triggerEff: [
                        {trigger: ['attackT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is tempted. (<u>weak to dark</u>)`, c);
                            },
                            category: ['dark'],
                            eff: [
                                {weak: ['dark']}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    soulrot: {
        aiType: 'attackBasic',
        name: 'Soulrot',
        descMenu: `Exert a malignant force upon an enemy's soul, damaging them over time.`,
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textSuccess: function (c,t) { return `${c.name} places a curse on ${t.name}, afflicting ${t.him} with soulrot!`; },
                textMiss: function (c,t) { return `${c.name} curses ${t.name}, but nothing happens.` },
                element: 'dark',
                accuracy: 85,
                damageP: 17,
                damage: 5,
                critChance: 10
            },
            {actFn: 'modify',
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Soulrot',
                    tooltip: 'Deals 5% of max health as damage each turn.',
                    expCount: 4,
                    expTime: 'tTurnStart',
                    tTurnStart: function (c) {
                        const damage = Math.floor(c.maxHp * 0.05 + 0.5);
                        c.adjustHp('damage', damage);
                        createMessage('priority', `${c.name} suffers from <b>soulrot</b>. (<u>${damage} damage</u>).`);
                    }
                }
            }
        ]
    },
    newMoon: {
        aiType: 'buffAllyTeam',
        name: 'New Moon',
        descMenu: `Beckon the moon, putting it in the earth's shadow.<br>Boosts dark attacks.`,
        category: ['celestial', 'moon'],
        selectTarget: 'everyone',
        action: [
            {actFn: 'modify',
                textAct: function (c,t) { return `${c.name} beckons the moon into earth's shadow.<br>The world is awash in dark energy.`; },
                modifier: {
                    id: 'celestial',
                    global: true,
                    onePerId: 'global',
                    expCount: 10,
                    expTime: 'roundStart',
                    tTurnStart: function (c) {
                        if (c.team === 'ally') {
                            createMessage('celestial', `A <b>new moon</b> is in the sky.`);
                        }
                    },
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('celestial', `The <b>new moon</b> radiates dark energy.`, c);
                            },
                            category: ['dark'],
                            eff: [
                                {stat: 'accuracyM', multi: 1.05},
                                {stat: 'damageM', multi: 1.20}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    ginga: {
        name: 'Ginga',
        descMenu: `A fluid style of footwork that priorities agility and evasiveness.`,
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c, t) { return `${c.name} begins a dancing footwork, moving unpredictably.<br>(+<u>agility</u>, +<u>dodge</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Ginga',
                    eff: [
                        {stat: 'agi', val: 2},
                        {stat: 'dodgeM', multi: 1.05}
                    ]
                }
            }
        ]
    },
    rainbow: {
        aiType: 'attackBasic',
        name: 'Rainbow',
        descMenu: 'Harm an enemy with the light of a rainbow.',
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textSuccess: function (c,t) { return `A rainbow pierces ${t.name}.` },
                textMiss: function (c,t) { return `${t.name} is harmlessly awash with beautiful colours.`; },
                element: ['light'],
                accuracy: 85,
                damageP: 20,
                damage: 8
            }
        ]
    },
    armadaKick: {
        aiType: 'attackBasic',
        category: ['unarmed', 'kick'],
        name: 'Armada Kick',
        descMenu: 'Spin around and perform a powerful roundhouse kick.',
        action: [
            {actFn: 'attack',
                category: ['unarmed', 'kick'],
                textSuccess: function (c,t) { return `${c.name} spins, striking ${t.name} with a reverse roundhouse kick.` },
                textMiss: function (c,t) { return `${c.name} spins, missing ${t.name} with a kick.`; },
                accuracy: 70,
                damageP: 20,
                damage: 8,
                critChance: 25,
                critMultiplier: 1.34,
                conDamage: 1.5
            }
        ]
    },
    negativa: {
        name: 'Negativa',
        aiType: 'buffAlly',
        descMenu: `Drop into an evasive stance low to the floor, positioning your legs for powerful kicking attacks.`,
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c, t) { return `${c.name} is in negativa position, hands on the floor and legs poised to kick.<br>${t.name} is harder to hit. (+<u>dodge</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Negativa',
                    exhaustCount: 1,
                    eff: [
                        {stat: 'dodge', val: 10},
                        {stat: 'dodgeM', val: 1.15}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            category: ['kick'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is kicking from negativa position.`, c);
                            },
                            exhaustCost: 1,
                            eff: [
                                {stat: 'accuracy', val: 5},
                                {stat: 'damageM', multi: 1.66},
                                {stat: 'critChance', val: 34}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    savage: {
        aiType: 'attackBasic',
        name: 'Savage',
        descMenu: 'Harass an enemy with multiple attacks.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} lunges and bites ${t.name}.`},
                accuracy: 90,
                damageP: 17,
                damage: 5,
                conDamage: 0.5
            },
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} bites ${t.name} again.`},
                textMiss: function (c,t) {return `${c.name} bites at ${t.name} again but misses.`;},
                accuracy: 75,
                damageP: 17,
                damage: 3,
                conDamage: 0.5
            },
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} bites ${t.name} again.`},
                textMiss: function (c,t) {return `${c.name} bites at ${t.name} again but misses.`;},
                accuracy: 60,
                damageP: 17,
                damage: 1,
                conDamage: 0.5
            }
        ]
    },
    malandragem: {
        aiType: 'attackBasic',
        category: ['unarmed'],
        name: 'Malandragem',
        descMenu: `Play a dirty trick on an enemy using your cunning and guile.<br>Critical hits inflict 'Dirty Trick'.`,
        selectTarget: 'enemySingle',
        action: [ 
            {actFn: 'attack',
                textSuccess: function (c,t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} trips ${t.name} over.`; }},
                        {textFn: function (c, t) { return `${c.name} hits ${t.name} in the groin.`; }},
                        {textFn: function (c, t) { return `${c.name} takes ${t.name} by surprise with a headbutt.`; }},
                        {textFn: function (c, t) { return `${c.name} pokes ${t.name} in the eye.`; }}
                    ]
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                textMiss: function (c, t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} tries to trip ${t.name} but fails.`; }},
                        {textFn: function (c, t) { return `${c.name} tries to hit ${t.name} in the groin but misses.`; }},
                        {textFn: function (c, t) { return `${c.name} tries to headbutt ${t.name} but misses.`; }},
                        {textFn: function (c, t) { return `${c.name} tries to poke ${t.name} in the eye but misses.`; }}
                    ]
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                statDam: 'agi',
                accuracy: 85,
                damageP: 17,
                damage: 6,
                critChance: 40,
                critMultiplier: 1.34,
                conDamage: 2
            },
            {actFn: 'modify',
                target: 'prevCritical',
                textSuccess: function (c,t) { return `Dirty trick!<br>Lasts two turns. (-<u>dodge</u>, -<u>accuracy</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Dirty Trick',
                    expCount: 2,
                    expTime: 'tTurnEnd',
                    eff: [
                        {stat: 'dodgeM', multi: 0.95},
                        {stat: 'accuracyM', multi: 0.95}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is off-guard.`, c);
                            }
                        },
                        {trigger: ['attackT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is off-guard.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    slipstream: {
        aiType: 'buffAlly',
        name: 'Slipstream',
        descMenu: `Sheathe an ally's weapon in a stream of water, so that it deals boosted water damage.`,
        selectTarget: 'allySingle',
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) {
                    if (c.uid === t.uid) {
                        return `${c.name} holds ${c.his} hand against ${c.his} ${c.weapon.name}, summoning a stream of water around it.<br>Lasts four turns.`;
                    } else {
                        return `${c.name} holds ${c.his} hand against ${t.name}'s ${t.weapon.name}, summoning a stream of water around it.<br>Lasts four turns.`;
                    }
                },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Slipstream',
                    expTime: 'tTurnEnd',
                    expCount: 4,
                    tTurnStart: function (c) {
                        createMessage('char', `${c.name}'s weapon is slipstreamed. (<u>water element</u>)`, c);
                    },
                    eff: [ {weaponElement: 'water'} ],
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name}'s weapon is slipstreamed. (<u>water element</u>)`, c);
                            },
                            category: ['weapon'],
                            category2: ['water'], 
                            eff: [
                                {stat: 'damageM', multi: 1.25},
                                {stat: 'damage', val: 1}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    torrent: {
        aiType: 'attackBasic',
        name: 'Torrent',
        descMenu: 'Spray a pressurised jet of water at an enemy.',
        action: [
            {actFn: 'attack',
                attackType :'magicMat',
                element: 'water',
                textSuccess: function (c,t) {return `${c.name} blasts ${t.name} with a torrent of water.`},
                textMiss: function (c,t) {return `${c.name} sprays a jet of water at ${t.name} but misses.`},
                accuracy: 90,
                damageP: 17,
                damage: 6,
                conDamage: 2
            }
        ]
    },
    reave: {
        aiType: 'attackBasic',
        name: 'Reave',
        category: ['weaponSkill'],
        descMenu: 'Swing a crushing blow at the enemy, making them vulnerable to attacks.',
        descAction: `Inflicts 'Reaved' on hit, lowering the enemy's dodge and defence.`,
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) { return `${c.name} strikes ${t.name} with a harsh blow.` },
                textMiss: function (c,t) { return `${c.name} swings at ${t.name} but misses.`; },
                accuracy: 85,
                damageP: 17,
                damage: 5,
                critChance: 10,
                conDamage: 2
            },
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${t.name}'s defence is lowered.<br>Lasts two turns. (-<u>defence</u>, -<u>dodge</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Reaved',
                    expCount: 2,
                    expTime: 'tTurnStart',
                    eff: [
                        {stat: 'defenceM', multi: 0.85},
                        {stat: 'dodge', val: -5}
                    ]
                }
            }
        ]
    },
    doubleKick: {
        aiType: 'attackBasic',
        category: ['unarmed', 'kick'],
        name: 'Double Kick',
        descMenu: 'Cartwheel around an enemy, kicking them twice as you roll.',
        action: [ 
            {actFn: 'attack',
                category: ['unarmed', 'kick'],
                textSuccess: function (c,t) { return `${c.name} cartwheels around ${t.name}, striking with a kick.` },
                textMiss: function (c,t) { return `${c.name} cartwheels around ${t.name}, trying to kick ${t.him} but missing.`; },
                accuracy: 80,
                damageP: 17,
                damage: 5,
                conDamage: 0.5,
                stopAction: 'miss'
            },
            {actFn: 'attack',
                category: ['unarmed', 'kick'],
                textSuccess: function (c,t) { return `${c.name} kicks ${t.name} again!` },
                textMiss: function (c,t) { return `${c.name} kicks at ${t.name} again but misses.`; },
                accuracy: 80,
                damageP: 17,
                damage: 3,
                conDamage: 0.5,
                stopAction: 'miss',
            },
            {actFn: 'modify',
                id: 'cartwheel',
                target: 'yourself',
                textSuccess: function (c,t) { return `${t.name} is cartwheeling. (+<u>dodge</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Cartwheel',
                    expCount: 1,
                    expTime: 'tTurnStart',
                    eff: [
                        {stat: 'dodge', val: 5},
                        {stat: 'dodgeM', multi: 1.15}
                    ]
                }
            }
        ]
    },
    crescentKick: {
        aiType: 'attackBasic',
        category: ['unarmed', 'kick'],
        name: 'Crescent Kick',
        descMenu: 'Perform a rolling handstand, using the momentum to strike an enemy with the back of your foot.',
        action: [ 
            {actFn: 'attack',
                category: ['unarmed', 'kick'],
                textSuccess: function (c,t) { return `${c.name} rolls on the floor and strikes ${t.name} with the back of ${c.his} foot.` },
                textMiss: function (c,t) { return `${c.name} does a rolling handstand while trying to kick ${t.name}, but misses.`; },
                accuracy: 80,
                damageP: 20,
                damage: 7,
                conDamage: 1.5,
                critChance: 20,
                critMultiplier: 1.34,
                stopAction: 'miss'
            },
            {actFn: 'modify',
                target: 'yourself',
                textSuccess: function (c,t) { return `${t.name} is cartwheeling. (+<u>dodge</u>)`; },
                modifier: {
                    id: 'cartwheel',
                    onePerId: 'target',
                    descriptor: 'Cartwheel',
                    expCount: 1,
                    expTime: 'tTurnStart',
                    eff: [
                        {stat: 'dodge', val: 5},
                        {stat: 'dodgeM', multi: 1.15}
                    ]
                }
            }
        ]
    },
    rainDance: {
        aiType: 'buffAllyTeam',
        name: 'Rain Dance',
        descMenu: 'Summon rain, boosting water attacks.',
        category: ['weather', 'rain'],
        selectTarget: 'everyone',
        action: [
            {actFn: 'modify',
                textAct: function (c,t) {
                    animate.rain();
                    return `${c.name} invokes spirits of air and water in a ritual dance.<br>Rain begins to fall.`;
                },
                modifier: {
                    id: 'weather',
                    global: true,
                    onePerId: 'global',
                    expCount: 10,
                    expTime: 'roundStart',
                    tTurnStart: function (c) {
                        if (c.team === 'ally') {
                            createMessage('weather', `It's <b>raining</b>.`);
                        }
                    },
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('weather', `It's <b>raining</b>.`, c);
                            },
                            category: ['water'],
                            eff: [
                                {stat: 'accuracyM', multi: 1.05},
                                {stat: 'damageM', multi: 1.20}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    lunge: {
        aiType: 'attackBasic',
        name: 'Lunge',
        category: ['weaponSkill'],
        descMenu: 'Take a lunging strike against an enemy.',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) { return `${c.name} lunges forward and strikes ${t.name}.` },
                textMiss: function (c,t) { return `${c.name} lunges at ${t.name}, but misses.`; },
                accuracy: 85,
                damageP: 20,
                damage: 7,
                critChance: 20,
            }
        ]
    },
    sharpen: {
        aiType: 'buffAlly',
        name: 'Sharpen',
        descMenu: `Sharpen an ally's weapon.`,
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) {
                    if (c.uid === t.uid) {
                        return `${c.name} sharpens ${c.his} ${c.weapon.name}.<br>Lasts for three attacks. (+<u>crit chance</u>, +<u>crit damage</u>).`;
                    } else {
                        return `${c.name} sharpens ${t.name}'s ${t.weapon.name}.<br>Lasts for three attacks. (+<u>crit chance</u>, +<u>crit damage</u>).`;
                    }
                },
                modifier: {
                    id: 'sharpen',
                    onePerId: 'target',
                    descriptor: 'Sharpen',
                    exhaustCount: 3,
                    triggerEff: [
                        {trigger: ['attackSuccess'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name}'s ${c.weapon.name} is sharp.`, c);
                            },
                            category: ['weapon'],
                            eff: [
                                {stat: 'critChance', val: 45},
                                {stat: 'critMultiplier', val: 0.1}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    polish: {
        aiType: 'buffAlly',
        name: 'Polish',
        descMenu: `Treat an ally's armour.<br>Lasts for three attacks.`,
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) {
                    if (c.uid === t.uid) {
                        return `${c.name} polishes ${c.his} ${c.armour.name}.<br>Lasts for three attacks. (+<u>defence</u>).`;
                    } else {
                        return `${c.name} polishes ${t.name}'s ${t.armour.name}.<br>Lasts for three attacks. (+<u>defence</u>).`;
                    }
                },
                modifier: {
                    id: 'polish',
                    onePerId: 'target',
                    descriptor: 'Polish',
                    exhaustCount: 3,
                    triggerEff: [
                        {trigger: ['attackSuccessT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name}'s ${c.armour.name} is polished.`, c);
                            },
                            eff: [
                                {stat: 'defence', val: 4, multi: 1.34},
                                {stat: 'defenceM', multi: 1.34}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    salve: {
        aiType: 'buffAlly',
        aiReq: 'hurt',
        name: 'Salve',
        descMenu: 'Apply a salve to an ally, slowly healing them.',
        descAction: `Heals a small amount.<br>Restores 5 health at the start of each turn.`,
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) {
                    if (c.uid === t.uid) {
                        return `${c.name} applies a healing salve to ${c.himself}.`;
                    } else {
                        return `${c.name} applies a healing salve to ${t.name}.`;
                    }
                },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Salve',
                    tooltip: 'Heals 5 health each turn.',
                    expTime: 'tTurnStart',
                    expCount: 4,
                    heal: 5,
                    tTurnStart: function (c) {
                        const prevHp = c.currentHp;
                        c.adjustHp('heal', this.heal);
                        const healDealt = c.currentHp - prevHp;
                        if (healDealt > 0) {
                            createMessage('priority', `${c.name} is healed by <b>salve</b>. (<u>healed ${healDealt}</u>)`);
                        }
                        c.adjustCon('phys', 'heal', 0.34);
                    }
                }
            },
            {actFn: 'heal',
                textSuccess: function (c, t) { return `${t.name} feels a little better.`; },
                heal: 5,
                statHeal: 'int',
                healP: 10,
                conHeal: 2,
                conHealElement: 'phys'
            }
        ]
    },
    mock: {
        aiType: 'attackBasic',
        name: 'Mock',
        descMenu: `Make fun of an enemy.<br>On hit, worsens enemy sentiment.<br>Critical hits inflict 'Pissed Off'.`,
        selectTarget: 'enemySingle',
        category: ['weaponSkill'],
        action: [ 
            {actFn: 'attack',
                attackType: 'social',
                textSuccess: function (c,t) {
                    t.sentiment -= 1;
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} insults ${t.name}'s mother.` }},
                        {textFn: function (c, t) { return `${c.name} makes fun of ${t.name}'s clothing.` }},
                        {textFn: function (c, t) { return `${c.name} makes a snide remark about ${t.name}'s appearance.` }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                textMiss: function (c, t) {
                    t.sentiment -= 1;
                    return `${c.name} makes an offensive remark about ${t.name}, but ${t.he} doesn't care.`;
                },
                element: 'mind',
                accuracy: 90,
                damageP: 17,
                damage: 6,
                critChance: 40,
                critMultiplier: 1.34,
                conDamage: 2
            },
            {actFn: 'modify',
                target: 'prevCritical',
                textSuccess: function (c,t) { return `${t.name} is pissed off.<br>Lasts two turns. (-<u>charisma</u>, -<u>will</u>, -<u>accuracy</u>)`; },
                modifier: {
                    id: 'joke',
                    onePerId: 'target',
                    descriptor: 'Pissed Off',
                    expCount: 2,
                    expTime: 'tTurnEnd',
                    tTurnStart: function (c) {
                        c.adjustCon('mind', 'damage', 0.5);
                    },
                    eff: [
                        {stat: 'cha', multi: 0.85},
                        {stat: 'wil', multi: 0.85},
                        {stat: 'accuracyM', multi: 0.85}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is pissed off.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    wickedGrin: {
        aiType: 'attackBasic',
        aiPref: 'backupAttack',
        name: 'Wicked Grin',
        descMenu: `Grin at an enemy, striking fear in their heart.`,
        selectTarget: 'enemySingle',
        category: ['weaponSkill'],
        action: [ 
            {actFn: 'attack',
                attackType: 'social',
                textSuccess: function (c,t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} smiles at ${t.name} menacingly.` }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                textMiss: function (c, t) {
                    return `${c.name} smiles menacingly at ${t.name}, but it has no effect.`;
                },
                element: 'mind',
                accuracy: 70,
                damageP: 20,
                damage: 7,
                critChance: 40,
                critMultiplier: 1.34,
                conDamage: 2
            }
        ]
    },
    shareJoke: {
        aiType: 'buffAllyTeam',
        aiReq: 'hurt',
        name: 'Share Joke',
        descMenu: `Raise your allies' spirits with humour.`,
        selectTarget: 'allyTeam',
        action: [
            {actFn: 'modify',
                textAct: function (c) { return `${c.name} shouts a joke to ${c.his} allies, raising their spirits.<br>Lasts three turns. (+<u>will</u>, +<u>defence</u>)`},
                modifier: {
                    id: 'joke',
                    shared: true,
                    onePerId: 'team',
                    descriptor: 'Joy',
                    expCount: 3,
                    expTime: 'cTurnStart',
                    heal: 3,
                    eff: [
                        {stat: 'wil', multi: 1.17},
                        {stat: 'defence', val: 1},
                        {stat: 'defenceM', multi: 1.17}
                    ],
                    triggerEff: [
                        {trigger: ['attackT'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is in good spirits.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    fireball: {
        aiType: 'attackBasic',
        name: 'Fireball',
        descMenu: 'Shoot a ball of fire to immolate an enemy.',
        action: [
            {actFn: 'attack',
                attackType :'magicMat',
                element: 'fire',
                textSuccess: function (c,t) {return `${c.name} throws a fireball at ${t.name}.`},
                textMiss: function (c,t) {return `${c.name} throws a fireball at ${t.name} and misses.`},
                accuracy: 90,
                damageP: 17,
                damage: 6,
                conDamage: 2
            }
        ]
    },
    wildSwing: {
        aiType: 'attackRandom',
        name: 'Wild Swing',
        category: ['weaponSkill'],
        descMenu: 'Swing your weapon wildly at a random enemy.',
        selectTarget: 'enemyRandom',
        action: [
            {actFn: 'attack',
                textSuccess: function (c,t) {return `${c.name} swings at ${t.name}.`},
                accuracy: 82,
                damageP: 20,
                damage: 7,
                conDamage: 2,
                critChance: 10
            }
        ]
    },
    rampage: {
        aiType: 'attackRandom',
        name: 'Rampage',
        descMenu: 'Attack nearby enemies with reckless abandon.',
        selectTarget: 'enemyRandom',
        randomMin: 1,
        randomMax: 3,
        targetRepeat: true,
        action: [
            {actFn: 'attack',
                textAct: function (c) { return `${c.name} attacks the nearest enemies with reckless abandon.`; },
                textSuccess: function (c,t) { return `${c.name} strikes ${t.name}.`; },
                textMiss: function (c,t) { return `${c.name} swings at ${t.name} but misses.` },
                accuracy: 85,
                damageP: 17,
                damage: 6,
                conDamage: 0.5
            }
        ]
    },
    phenomena: {
        aiType: 'attackRandom',
        name: 'Phenomena',
        descMenu: 'Manifest a sequence of improbable events.',
        selectTarget: 'enemyRandom',
        randomMin: 2,
        randomMax: 3,
        targetRepeat: true,
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textAct: function (c) { return `${c.name} makes improbable events happen.`; },
                textSuccess: function (c,t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `A wild boar charges through ${t.name}.`; }},
                        {textFn: function (c, t) { return `A stray arrow hits ${t.name}.`; }},
                        {textFn: function (c, t) { return `A fish falls out of the sky, hitting ${t.name}.`; }},
                        {textFn: function (c, t) { return `${t.name} is stung by a wasp.`; }},
                        {textFn: function (c, t) { return `${t.name} starts choking.`; }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return `${resultOptions[random].textFn(c,t)}`;
                },
                textMiss: function (c,t) {
                    const resultOptions = [
                        {textFn: function (c, t) { return `${t.name} forgets ${t.his} own name for a moment.`; }},
                        {textFn: function (c, t) { return `${t.name} almost trips over ${t.his} own foot.`; }},
                        {textFn: function (c, t) { return `${t.name} has a strange feeling.`; }},
                        {textFn: function (c, t) { return `${t.name} yawns.`; }},
                        {textFn: function (c, t) { return `${t.name} remembers an old friend.`; }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return `${resultOptions[random].textFn(c,t)}`;
                },
                element: 'phys',
                accuracy: 72,
                damageP: 17,
                damage: 3,
                conDamage: 0.67
            }
        ]
    },
    chainLightning: {
        aiType: 'attackBasic',
        name: 'Chain Lightning',
        descMenu: 'Shoot lightning at an enemy, with the chance of arcing to someone else.',
        descAction: 'On hit, targets another enemy with a slightly weaker attack.',
        action: [
            {actFn: 'attack',
                attackType: 'magicMen',
                element: 'elec',
                textSuccess: function (c,t) { return `${c.name} channels lightning from ${c.his} hands, striking ${t.name}.`; },
                textMiss: function (c,t) { return `${c.name} summons lightning to strike ${t.name} but misses.`},
                accuracy: 85,
                statDef: 'int',
                damageP: 17,
                damage: 6,
                stopAction: 'miss'
            },
            {actFn: 'attack',
                target: 'enemyRandom',
                targetNotPrev: true,
                textSuccess: function (c,t) { return `The lightning arcs to ${t.name}.`; },
                textMiss: function (c,t) { return `The lightning arcs, almost hitting ${t.name}.`},
                accuracy: 82,
                statDef: 'int',
                damageP: 17,
                damage: 5,
                conDamage: 0.5
            }
        ]
    },
    throwBomb: {
        aiType: 'attackTeam',
        name: 'Throw Bomb',
        descMenu: 'Throw a bomb at the enemy team.',
        selectTarget: 'enemyTeam',
        action: [
            {actFn: 'attack',
                attackType: 'ranged',
                textAct: function (c) { return `${c.name} throws a bomb at ${c.his} enemies.` },
                textSuccess: function (c,t) {return `${t.name} is hurt in the explosion.`},
                element: 'fire',
                statAcc: 'int',
                statDam: 'int',
                statDef: 'int',
                accuracy: 85,
                damageP: 17,
                damage: 6,
                conDamage: 0.5
            }
        ]
    },
    warCry: {
        aiType: 'buffAllyTeam',
        name: 'War Cry',
        descMenu: `Let out an invigorating war cry, increasing your allies' attack damage.`,
        selectTarget: 'allyTeam',
        action: [
            {actFn: 'modify',
                textAct: function (c) { return `${c.name} shouts a war cry, rallying ${c.his} allies.<br>Lasts three turns. (+<u>damage</u>)`},
                modifier: {
                    shared: true,
                    onePerId: 'team',
                    descriptor: 'War Cry',
                    expCount: 3,
                    expTime: 'cTurnStart',
                    eff: [
                        {stat: 'damage', val: 1},
                        {stat: 'damageM', multi: 1.2}
                    ],
                    triggerEff: [
                        {trigger: ['attackSuccess'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is ready for war.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    howl: {
        aiType: 'buffAllyTeam',
        name: 'Howl',
        descMenu: `Howl to the sky, exciting your allies.`,
        selectTarget: 'allyTeam',
        action: [
            {actFn: 'modify',
                textAct: function (c) { return `${c.name} howls to the sky.<br>Lasts three turns. (+<u>damage</u>)`},
                modifier: {
                    shared: true,
                    onePerId: 'team',
                    descriptor: 'Howl',
                    expCount: 3,
                    expTime: 'cTurnEnd',
                    eff: [
                        {stat: 'damageM', multi: 1.1}
                    ],
                    triggerEff: [
                        {trigger: ['attackSuccess'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} attacks viciously.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    coordinate: {
        aiType: 'buffAllyTeam',
        name: 'Coordinate',
        descMenu: `Command your allies, coordinating their tactics.`,
        selectTarget: 'allyTeam',
        action: [
            {actFn: 'modify',
                textAct: function (c) { return `${c.name} yells commands to ${c.his} allies.<br>Lasts two attacks. (+<u>accuracy</u>, +<u>damage</u>)`},
                modifier: {
                    id: 'command',
                    onePerId: 'target',
                    descriptor: 'Coordinate',
                    exhaustCount: 2,
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                if (this.cUid === this.tUid) {
                                    createMessage('char', `${c.name} is coordinated.`, c);
                                } else {
                                    createMessage('char', `${c.name} follows ${this.char.name}'s command.`, c);
                                }
                            },
                            exhaustCost: 1,
                            eff: [
                                {stat: 'accuracyM', multi: 1.2},
                                {stat: 'damageM', multi: 1.2}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    message: {
        aiType: 'buffAlly',
        name: 'Message',
        descMenu: `Transmit a revelatory message to an ally.`,
        selectTarget: 'allySingle',
        selectOther: true,
        action: [
            {actFn: 'modify',
                textAct: function (c, t) {
                    if (c.uid === this.targetList[0].uid) {
                        return `${c.name} revels in the glory of creation.`;
                    } else {
                        return `${c.name} reveals a hidden truth to ${this.targetList[0].name}.`;
                    }
                },
                textSuccess: function (c, t) { return `${t.name} is inspired.<br>(+<u>damage</u>, +<u>heal power</u>)`; },
                modifier: {
                    id: 'message',
                    onePerId: 'target',
                    descriptor: 'Message',
                    exhaustCount: 2,
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) { createMessage('char', `${c.name} is inspired.`, c); },
                            exhaustCost: 1,
                            eff: [
                                {stat: 'damageM', multi: 1.5}
                            ]
                        },
                        {trigger: ['heal'],
                            triggerFn: function (c) { createMessage('char', `${c.name} is inspired.`, c); },
                            exhaustCost: 1,
                            eff: [
                                {stat: 'healTargetM', multi: 1.5}
                            ]
                        }
                    ]
                }
            }
        ]
    },
    leadersFavour: {
        name: `Leader's Favour`,
        descMenu: 'Bestow your favour on two random team members.',
        selectTarget: 'allyRandom',
        selectOther: true,
        randomNumber: 2,
        action: [
            {actFn: 'modify',
                textAct: function (c) { 
                    if (this.targetList.length === 1) {
                        return `${c.name} bestows ${c.his} favour on ${this.targetList[0].name}.`;
                    } else if (this.targetList.length === 2) {
                        return `${c.name} bestows ${c.his} favour on ${this.targetList[0].name} and ${this.targetList[1].name}.`;
                    }
                },
                modifier: {
                    id: 'favour',
                    shared: true,
                    descriptor: `Favour`,
                    onePerId: 'team',
                    expCount: 1,
                    expTime: 'cTurnStart',
                    eff: [
                        {stat: 'accuracyM', multi: 1.1},
                        {stat: 'dodgeM', multi: 1.1},
                        {stat: 'damageM', multi: 1.1},
                        {stat: 'defenceM', multi: 1.1}
                    ]
                }
            }
        ]
    },
    healingTouch: {
        name: `Healing Touch`,
        descMenu: 'Heal an ally.',
        selectTarget: 'allySingle',
        aiType: 'healAlly',
        action: [
            {actFn: 'heal',
                textAct: function (c) {
                    if (c.uid === this.targetList[0].uid) {
                        return `${c.name} channels glorious energy into ${c.his} own body.`;
                    }
                    else {
                        return `${c.name} lays a hand on ${this.targetList[0].name}, channeling holy power.`;
                    }
                },
                textSuccess: function (c, t) { return `${t.name}'s body is remade.`; },
                heal: 3,
                statHeal: 'cha',
                healP: 20,
                conHeal: 1
            }
        ]
    },
    netafim: {
        name: `Netafim`,
        descMenu: 'Sprinkle blessed water on an ally, healing them.',
        selectTarget: 'allySingle',
        aiType: 'healAlly',
        action: [
            {actFn: 'heal',
                textAct: function (c) {
                    if (this.targetList[0].uid === c.uid) {
                        return `${c.name} anoints ${c.himself} with blessed water.`;
                    } else {
                        return `${c.name} anoints ${this.targetList[0].name} with blessed water.`;
                    }
                },
                textSuccess: function (c, t) { return `${t.name} is refreshed.`; },
                heal: 4,
                statHeal: 'cha',
                healP: 20,
                conHeal: 1,
            }
        ]
    },
    glare: {
        aiType: 'debuffEnemy',
        name: 'Glare',
        descMenu: 'Stare intently at an enemy, making them nervous.',
        selectTarget: 'enemySingle',
        action: [
            {actFn: 'modify',
                textSuccess: function (c, t) {
                    return `${c.name} glares at ${t.name}, making ${t.him} uncomfortable.<br>Lasts three turns. (-<u>accuracy</u>, -<u>damage</u>)`;
                },
                modifier: {
                    onePerC: 'global',
                    descriptor: 'Glare',
                    expCount: 3,
                    expTime: 'cTurnStart',
                    tTurnStart: function (c) {
                        if (this.char.dead) { this.remove(); }
                    },
                    eff: [
                        {stat: 'accuracyM', multi: 0.85},
                        {stat: 'damageM', multi: 0.85}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is self-conscious.`, c);
                            }
                        }
                    ]
                }

            }
        ]
    },
    beguile: {
        aiType: 'attackBasic',
        name: 'Beguile',
        descMenu: 'Charm an enemy, lowering their guard.',
        descAction: `Improves enemy sentiment.<br>Critical hits inflict 'Beguile'.`,
        selectTarget: 'enemySingle',
        category: ['weaponSkill'],
        action: [ 
            {actFn: 'attack',
                attackType: 'social',
                textSuccess: function (c,t) {
                    t.sentiment += 1;
                    const resultOptions = [
                        {textFn: function (c, t) { return `${c.name} smiles and winks at ${t.name}.` }},
                        {textFn: function (c, t) { return `${c.name} blows a kiss to ${t.name}.` }}
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                textMiss: function (c, t) {
                    t.sentiment -= 0.5;
                    return `${c.name} tries to seduce ${t.name} but makes a fool of ${c.himself}.`;
                },
                element: 'mind',
                accuracy: 85,
                damageP: 17,
                damage: 4,
                critChance: 45,
                critMultiplier: 1.34,
                conDamage: 2
            },
            {actFn: 'modify',
                target: 'prevCritical',
                textSuccess: function (c,t) { return `${t.name} has butterflies in ${t.his} stomache.<br>Lasts until attacked. (-<u>dodge</u>, -<u>defence</u>, -<u>intellect</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Beguile', 
                    exhaustCount: 1,
                    expTime: 'tTurnStart',
                    eff: [
                        {stat: 'dodgeM', multi: 0.8},
                        {stat: 'defenceM', multi: 0.8},
                        {stat: 'int', multi: 0.9}
                    ],
                    triggerEff: [
                        {trigger: ['attackT'],
                            exhaustCost: 1,
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is daydreaming about ${this.char.name}.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    sneer: {
        aiType: 'attackBasic',
        name: 'Sneer',
        descMenu: 'Bare your teeth at an enemy.',
        descAction: `Critical hits inflict 'Sneer'.`,
        selectTarget: 'enemySingle',
        category: ['weaponSkill'],
        action: [ 
            {actFn: 'attack',
                attackType: 'social',
                textSuccess: function (c,t) { return `${c.name} sneers and bares ${c.his} teeth at ${t.name}.`; },
                textMiss: function (c, t) { return `${c.name} sneers at ${t.name}, but ${t.he} isn't intimidated.`; },
                element: 'mind',
                statAcc: 'str',
                statDam: 'str',
                statDodge: 'wil',
                statDef: 'wil',
                accuracy: 85,
                damageP: 17,
                damage: 5,
                critChance: 40,
                critMultiplier: 1.34,
                conDamage: 2
            },
            {actFn: 'modify',
                target: 'prevCritical',
                textSuccess: function (c,t) { return `${t.name} is frightened.<br>Lasts two turns. (-<u>will</u>, -<u>accuracy</u>)`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Sneer',
                    expCount: 2,
                    expTime: 'tTurnEnd',
                    eff: [
                        {stat: 'wil', multi: 0.9},
                        {stat: 'accuracyM', multi: 0.9}
                    ],
                    triggerEff: [
                        {trigger: ['attack'],
                            triggerFn: function (c) {
                                createMessage('char', `${c.name} is wary.`, c);
                            }
                        }
                    ]
                }
            }
        ]
    },
    resplendence: {
        aiType: 'attackTeam',
        name: 'Resplendence',
        descMenu: 'Sear enemies with a resplendent light.',
        selectTarget: 'enemyTeam',
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textAct: function (c) { return `${c.name} creates a sphere of resplendent light.` },
                textSuccess: function (c,t) {return `${t.name} is hurt by its rays.`},
                textMiss: function (c, t) { return `${t.name} is unaffected.`; },
                element: 'light',
                statAcc: 'cha',
                statDam: 'cha',
                statDodge: 'cha',
                statDef: 'wil',
                accuracy: 85,
                damageP: 17,
                damage: 3,
                conDamage: 0.5
            }
        ]
    },
    apocrypha: {
        aiType: 'attackTeam',
        name: 'Apocrypha',
        descMenu: 'Spout dubious ideas at your enemies.',
        selectTarget: 'enemyTeam',
        action: [
            {actFn: 'attack',
                attackType: 'divineMen',
                textAct: function (c) {
                    const resultOptions = [
                        {textFn: function (c) { return `${c.name} makes a dubious claim.`; }},
                        {textFn: function (c) { return `${c.name} shares a strange thought.`; }},
                        {textFn: function (c) { return `${c.name} rambles about a conspiracy theory.`; }},
                        {textFn: function (c) { return `${c.name} explains why things are the way they are.`; }},
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return `${resultOptions[random].textFn(c)}`;
                },
                textSuccess: function (c,t) {return `${t.name} ponders ${c.his} words.`},
                textMiss: function (c, t) { return `${t.name} wasn't paying attention.`; },
                element: 'dark',
                statAcc: 'cha',
                statDam: 'cha',
                statDodge: 'cha',
                statDef: 'wil',
                accuracy: 75,
                damageP: 17,
                damage: 3,
                critChance: 15,
                critMultiplier: 1.25,
                conDamage: 0.5
            }
        ]
    }
};

const baseItem = {
    potion: {
        aiType: 'healAlly',
        aiReq: 'lowHealth',
        name: 'Potion',
        descMenu: 'A healing potion.',
        selectTarget: 'yourself',
        action: [
            {actFn: 'heal',
                healMaxHp: 20,
                conHeal: 2,
                textSuccess: function (c,t) {
                    return `${c.name} drinks a healing potion.`;
                }
            }
        ]
    },
    adrenalinePill: {
        aiType: 'buffAlly',
        aiReq: 'healthy',
        name: 'Adrenaline Pill',
        descMenu: `Increases agility and strength for three turns.`,
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${c.name} swallows an adrenaline pill.<br>Lasts four turns. (+<u>agility</u>, +<u>strength</u>).`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Adrenaline',
                    expCount: 5,
                    expTime: 'tTurnEnd',
                    eff: [
                        {stat: 'str', multi: 1.17},
                        {stat: 'agi', multi: 1.17}
                    ]
                }
            }
        ]
    },
    guaranaTea: {
        aiType: 'buffAlly',
        aiReq: 'healthy',
        name: 'Guarana Tea',
        descMenu: `An energising medicinal tea made with guarana seeds.`,
        selectTarget: 'yourself',
        action: [
            {actFn: 'modify',
                textSuccess: function (c,t) { return `${c.name} drinks a guarana tea.<br>Lasts three turns. (+<u>agility</u>).`; },
                modifier: {
                    onePerId: 'target',
                    descriptor: 'Guarana',
                    expCount: 4,
                    expTime: 'tTurnEnd',
                    eff: [
                        {stat: 'agi', multi: 1.25},
                        {stat: 'initiative', val: 5}
                    ]
                }
            }
        ]
    }
};

/*
let heal = act.heal ?? 0; //act.heal
if (act.healMaxHp) { heal += t.maxHp * (act.healMaxHp / 100); } //act.healMaxHp
if (act.statHeal) { heal += c[act.statHeal] * (act.healP / 100); } //act.statHeal, act.healP
heal = heal * c.healTargetM * t.healSelfM; //c.healTargetM, t.healSelfM
const prevHp = t.currentHp;
t.adjustHp('heal', heal);
const healDealt = t.currentHp - prevHp;
if (act.conHeal && !act.conHealElement) {
    elements.forEach(element => {
        t.adjustCon(element, 'heal', act.conHeal); //act.conHeal
    });
} else if (act.conHeal && act.conHealElement) {
    t.adjustCon(conHealElement, 'heal', act.conHeal); //act.conHeal, act.conHealElement
}
if (healDealt > 0) {
    resultContents += `${act.textSuccess(c,t)} (healed ${healDealt})`;
} else {
    resultContents += `${t.name} is already healthy.`;
}
*/

function updateStatbox () { 
    const charArray = combat().sort((a, b) => a.uid - b.uid);
    const printStats = ['str', 'agi', 'for', 'int', 'cha', 'wil'];
    charArray.forEach(char => {
        if (!char.statbox?.div) {
            const charbox = document.createElement('div'); //statbox
            charbox.id = `statbox${char.uid}`;
            charbox.className = 'statbox';
            if (char.team === 'ally') {
                statAlly.appendChild(charbox);
            } else if (char.team ==='enemy') {
                statEnemy.appendChild(charbox);
            }

            const namebox = document.createElement('div'); //name
            namebox.id = `statbox-name${char.uid}`;
            namebox.className = 'statbox-name';
            namebox.classList.add('stat-child');
            charbox.appendChild(namebox);

            const healthContainer = document.createElement('div'); //health text
            healthContainer.id = `statbox-health-container${char.uid}`;
            healthContainer.className = 'statbox-health-container';
            healthContainer.classList.add('stat-child');
            charbox.appendChild(healthContainer);

            const healthBarOuter = document.createElement('div'); //health bar container
            healthBarOuter.id = `health-bar-outer${char.uid}`;
            healthBarOuter.className = 'health-bar-outer';
            healthBarOuter.classList.add('stat-child');
            healthBarOuter.style.width = '185px';
            healthBarOuter.style.height = '12px';
            charbox.appendChild(healthBarOuter);

            const skullIcon = document.createElement('div');
            skullIcon.id = `statbox-skull${char.uid}`;
            skullIcon.className = 'stat-child';
            skullIcon.style.display = 'none';
            skullIcon.innerHTML = '<img src="images/skull.png" alt="Skull">';
            skullIcon.style.zIndex = '30';
            charbox.appendChild(skullIcon);

            const healthBar = document.createElement('div'); //health bar
            healthBar.id = `health-bar${char.uid}`;
            healthBar.className = 'health-bar';
            healthBar.style.width = healthBarOuter.style.width;
            healthBar.style.height = healthBarOuter.style.height;
            healthBar.style.transition = 'width 0.35s ease-in-out';
            charbox.appendChild(healthBar);

            const attributeContainer = document.createElement('div');
            attributeContainer.id = `attribute-container${char.uid}`;
            attributeContainer.className = `statbox-att-outer`;
            attributeContainer.classList.add('stat-child');
            charbox.appendChild(attributeContainer);

            const attribute0 = document.createElement('div'); //first row of stats
            attribute0.id = `attribute-container0${char.uid}`;
            attribute0.className = 'statbox-attribute-container';
            attributeContainer.appendChild(attribute0);

            const attribute1 = document.createElement('div'); //second row of stats
            attribute1.id = `attribute-container1${char.uid}`;
            attribute1.className = 'statbox-attribute-container';
            attributeContainer.appendChild(attribute1);

            let statDivs = {};
            printStats.forEach((stat, i) => {
                const div = document.createElement('div');
                div.id = `stat${stat}${char.uid}`;
                div.className = 'statbox-attribute';
                if (i <= 2) {
                    attribute0.appendChild(div);
                } else {
                    attribute1.appendChild(div);
                }
                statDivs[`${stat}`] = div;
            });

            const equipContainer = document.createElement('div'); //weapon and armour
            equipContainer.id = `equip-container${char.uid}`;
            equipContainer.className = 'statbox-attribute-container';
            equipContainer.classList.add('stat-child');
            charbox.appendChild(equipContainer);

            const weaponContainer = document.createElement('div'); //armour
            weaponContainer.id = `weapon-container${char.uid}`;
            weaponContainer.className = 'statbox-attribute';
            equipContainer.appendChild(weaponContainer);

            const armourContainer = document.createElement('div'); //armour
            armourContainer.id = `armour-container${char.uid}`;
            armourContainer.className = 'statbox-attribute';
            equipContainer.appendChild(armourContainer);

            const accessoryContainer = document.createElement('div'); //weapon and armour
            accessoryContainer.id = `accessory-container${char.uid}`;
            accessoryContainer.className = 'statbox-attribute-container';
            accessoryContainer.classList.add('stat-child');
            charbox.appendChild(accessoryContainer);

            const accessoryDiv = document.createElement('div'); //armour
            accessoryDiv.id = `accessory-div${char.uid}`;
            accessoryDiv.className = 'statbox-attribute';
            accessoryContainer.appendChild(accessoryDiv);

            const descPContainer = document.createElement('div');
            descPContainer.id = `desc-perm${char.uid}`;
            descPContainer.className = 'statbox-descriptor-perm';
            descPContainer.classList.add('stat-child');
            charbox.appendChild(descPContainer);

            const descAContainer = document.createElement('div');
            descAContainer.id = `desc-ally${char.uid}`;
            descAContainer.className = 'statbox-descriptor-ally';
            descAContainer.classList.add('stat-child');
            charbox.appendChild(descAContainer);

            const descEContainer = document.createElement('div');
            descEContainer.id = `desc-enemy${char.uid}`;
            descEContainer.className = 'statbox-descriptor-enemy';
            descEContainer.classList.add('stat-child');
            charbox.appendChild(descEContainer);
            
            char.statbox = {};
            char.statbox.div = charbox;
            char.statbox.name = {div: namebox};
            char.statbox.health = {div: healthContainer};
            char.statbox.healthBarOuter = {div: healthBarOuter};
            char.statbox.skullIcon = {div: skullIcon};
            char.statbox.healthBar = {div: healthBar};
            char.statbox.attributeContainer = {div: attributeContainer};
            printStats.forEach(stat => {
                char.statbox[`${stat}`] = {div: statDivs[`${stat}`]};
            });
            char.statbox.equipContainer = {div: equipContainer};
            char.statbox.weapon = {div: weaponContainer};
            char.statbox.armour = {div: armourContainer};
            char.statbox.accessory = {div: accessoryDiv};
            char.statbox.descP = {div: descPContainer};
            char.statbox.descA = {div: descAContainer}
            char.statbox.descE = {div: descEContainer};
        }
        const charbox = char.statbox;
        const charboxDiv = char.statbox.div;
        if (char.team === 'ally') {
            if (statEnemy.contains(charboxDiv)) {
                statEnemy.removeChild(charboxDiv);
            }
            if (!statAlly.contains(charboxDiv)) {
                statAlly.appendChild(charboxDiv);
            }
        } else if (char.team === 'enemy') {
            if (statAlly.contains(charboxDiv)) {
                statAlly.removeChild(charboxDiv);
            }
            if (!statEnemy.contains(charboxDiv)) {
                statEnemy.appendChild(charboxDiv);
            }
        }
        const namebox = charbox.name.div;
        namebox.innerHTML = `${char.name}`;
        namebox.style.position = 'absolute';
        namebox.style.top = '-35px';
        if (!char.dead) {
            charbox.healthBar.dead = false;

            charbox.skullIcon.div.style.display = 'none';
            const healthBarOuter = charbox.healthBarOuter.div;
            healthBarOuter.style.position = 'absolute';
            healthBarOuter.style.top = `${htmlFn.findPrevBottom(charboxDiv, 'stat-child', healthBarOuter) + 5}px`;
            
            const healthBar = charbox.healthBar.div; //update healthbar, change colour
            healthBar.style.position = 'absolute';
            healthBar.style.top = `${htmlFn.findSide(healthBarOuter, 'top') + 1}px`;
            healthBar.style.left = `${htmlFn.findSide(healthBarOuter, 'left')}px`;

            healthBar.style.border = '6px solid transparent';
            if ((char.currentHp / char.maxHp) <= 0.26) {
                healthBar.style.borderImageSource = 'url(images/healthBarInnerRed.png)';
            } else if ((char.currentHp / char.maxHp) <= 0.51) {
                healthBar.style.borderImageSource = 'url(images/healthBarInnerOrange.png)';
            } else if ((char.currentHp / char.maxHp) > 0.51) {
                healthBar.style.borderImageSource = 'url(images/healthBarInnerGreen.png)';
            }
            healthBar.style.borderImageSlice = '6'; // Adjust as needed
            healthBar.style.borderImageRepeat = 'repeat'; // or 'repeat', 'round'
            healthBar.style.transition = 'width 0.35s ease-in-out';
            healthBar.style.width = `${(char.currentHp / char.maxHp) * healthBarOuter.offsetWidth}px`;
            healthBar.style.boxSizing = 'border-box';
            healthBar.style.transition = 'width 0.5s ease, border-width 0.5s ease';

            const equipContainer = charbox.equipContainer.div;
            equipContainer.style.position = 'absolute';
            equipContainer.style.top = `${htmlFn.findPrevBottom(charboxDiv, 'stat-child', equipContainer) + 5}px`;
            charbox.weapon.div.innerHTML = `Weapon:<br><u>${char.weapon.name}</u>`;
            charbox.armour.div.innerHTML = `Armour:<br><u>${char.armour.name}</u>`;

            charboxDiv.querySelectorAll('.tt-reveal').forEach(ttReveal => {
                charboxDiv.removeChild(ttReveal);
            });

            const permMods = char.mods.filter(mod => mod.descriptor && mod.expCount === undefined && mod.exhaustCount === undefined);
            let permContents = permMods.map(mod => ({
                descriptor: mod.descriptor,
                tooltip: tooltipMod(mod)
            }));
            permContents = permContents.sort((a, b) => a.descriptor.toLowerCase().localeCompare(b.descriptor.toLowerCase()));

            const tempModsA = char.mods.filter(mod => mod.descriptor && (mod.expCount >= 0 || mod.exhaustCount >= 0) && targetTeam(char,'ally').find(ally => ally.uid === mod.cUid));
            let tempContentsA = tempModsA.map(mod => ({
                descriptor: mod.descriptor,
                tooltip: tooltipMod(mod)
            }));
            tempContentsA = tempContentsA.sort((a, b) => a.descriptor.toLowerCase().localeCompare(b.descriptor.toLowerCase()));

            const tempModsE = char.mods.filter(mod => mod.descriptor && (mod.expCount >= 0 || mod.exhaustCount >= 0) && targetTeam(char,'enemy').find(enemy => enemy.uid === mod.cUid));
            let tempContentsE = tempModsE.map(mod => ({
                descriptor: mod.descriptor,
                tooltip: tooltipMod(mod)
            }));
            tempContentsE = tempContentsE.sort((a, b) => a.descriptor.toLowerCase().localeCompare(b.descriptor.toLowerCase()));

            let descSections = [
                {type: 'permanent', contents: permContents, descDiv: charbox.descP.div},
                {type: 'ally', contents: tempContentsA, descDiv: charbox.descA.div},
                {type: 'enemy', contents: tempContentsE, descDiv: charbox.descE.div}
            ];

            let firstSec = true;
            charbox.descP.div.innerHTML = '';
            charbox.descP.div.style.display = 'none';
            charbox.descA.div.style.display = 'none';
            charbox.descE.div.style.display = 'none';
            
            descSections.forEach((sec) => {
                const con = sec.contents;
                const descDiv = charbox.descP.div; //TEMPORARY - CHANGE TO UNIVERSAL DESCRIPTOR CONTAINER
                if (con.length > 0 && firstSec) {
                    descDiv.style.display = 'flex';
                    descDiv.style.position = 'absolute';
                    descDiv.style.top = `${htmlFn.findPrevBottom(charboxDiv, 'stat-child', descDiv) + 5}px`;
                    firstSec = false;
                }
                // else {
                //    descDiv.style.display = 'block';
                //    descDiv.style.position = 'absolute';
                //    descDiv.style.top = `${htmlFn.findPrevBottom(charboxDiv, 'stat-child', descDiv) + 5}px`;
                //}
                con.forEach((desc, i) => {
                    const tt = document.createElement('span');
                    tt.classList.add('tt');
                    switch (sec.type) {
                        case 'permanent':
                            tt.style.backgroundColor = '#fff9c4';
                            break;
                        case 'ally':
                            tt.style.backgroundColor = '#cdf8ba';
                            break;
                        case 'enemy':
                            tt.style.backgroundColor = '#ffd6d6';
                            break;
                    }
                    const ttText = document.createElement('span');
                    ttText.textContent = desc.descriptor;
                    //ttText.style.border = '6px solid transparent';
                    //ttText.style.borderImageSource = 'url(images/permDescriptorBorder30x30.png)';
                    //ttText.style.borderImageSlice = '6'; // Adjust as needed
                    //ttText.style.borderImageRepeat = 'repeat';
                    //ttText.style.backgroundImage = "url('images/permDescriptorBg.pn')";
                    //ttText.style.backgroundSize = "contain";  // Fit within the container
                    //ttText.style.backgroundRepeat = "no-repeat";
                    ttText.style.boxSizing = 'border-box';
                    //HERE
                    tt.appendChild(ttText);
                    descDiv.appendChild(tt);
                    const ttReveal = document.createElement('div');
                    ttReveal.classList.add('tt-reveal');
                    ttReveal.innerHTML = desc.tooltip;
                    charboxDiv.appendChild(ttReveal);
                    tt.addEventListener('mouseover', () => {
                        charboxDiv.querySelectorAll('.tt-reveal').forEach(ttR => {
                            ttR.style.display = 'none';
                        });
                        tt.style.zIndex = '2';
                        ttReveal.style.display = 'block';
                        ttReveal.style.opacity = '1';
                        ttText.style.textDecoration = 'underline';
                        const charboxRect = charboxDiv.getBoundingClientRect();
                        const descRect = descDiv.getBoundingClientRect();
                        const top = descRect.top - charboxRect.top - ttReveal.offsetHeight - 37;
                        ttReveal.style.top = `${top}px`;
                        //ttReveal.style.borderWidth = '10px';
                        //ttReveal.style.borderStyle = 'solid';
                        //ttReveal.style.borderImage = "url('images/tooltip.png') 10 repeat";
                        //ttReveal.style.borderImageSlice = '10';
                        //ttReveal.style.borderImageRepeat = 'repeat';
                    });
                    tt.addEventListener('mouseleave', async () => {
                        tt.style.zIndex = '1';
                        console.log('activating mouseleave');
                        ttReveal.style.opacity = '0';
                        ttText.style.textDecoration = '';
                        await delay(150);
                        ttReveal.style.display = 'none';
                    });
                });
            });
            charboxDiv.style.height = `${htmlFn.findLastBottom(charboxDiv,'stat-child') + 45}px`;
        } else {
            const healthBarOuter = charbox.healthBarOuter.div;
            healthBarOuter.style.position = 'absolute';
            healthBarOuter.style.top = `${htmlFn.findPrevBottom(charboxDiv, 'stat-child', healthBarOuter) + 5}px`;

            const healthBar = charbox.healthBar.div; //update healthbar, change colour
            healthBar.style.position = 'absolute';
            healthBar.style.top = `${htmlFn.findSide(healthBarOuter, 'top') + 1}px`;
            healthBar.style.left = `${htmlFn.findSide(healthBarOuter, 'left')}px`;

            const skullIcon = charbox.skullIcon.div;
            skullIcon.style.top = `${htmlFn.findSide(healthBarOuter, 'top') - 3}px`;

            if (!charbox.healthBar.dead) {
                healthBar.style.borderImageSource = 'url(images/healthBarInnerRed.png)';
                healthBar.style.width = '0px';
            }

            const onTransitionEnd = (event) => {
                console.log(`Event listener triggered! Checking property: ${event.propertyName}`);
                if (event.propertyName === 'width') {
                    const currentWidth = window.getComputedStyle(healthBar).width;
                    if (parseFloat(currentWidth) === 12) {
                        skullIcon.style.display = 'block';
                        skullIcon.style.position = 'absolute';
                        skullIcon.style.top = `${htmlFn.findSide(healthBarOuter, 'top') - 3}px`;
                        healthBar.style.transition = 'width 0.2s ease-in-out';
                        healthBar.style.width = healthBarOuter.style.width;
                    
                        healthBar.style.borderImageSource = 'url(images/healthBarInnerDead.png)';
                        healthBar.style.borderImageSlice = '6';
                        healthBar.style.borderImageRepeat = 'repeat';
                    
                        charbox.healthBar.dead = true;
                        charbox.attributeContainer.div.innerHTML = '';
                        printStats.forEach(stat => {
                            charbox[`${stat}`].div.innerHTML = '';
                        });
                        charbox.descP.div.innerHTML = '';
                        charbox.descP.div.style.display = 'none';
                        charbox.descA.div.innerHTML = '';
                        charbox.descA.div.style.display = 'none';
                        charbox.descE.div.innerHTML = '';
                        charbox.descE.div.style.display = 'none';
                        charboxDiv.querySelectorAll('.tt-reveal').forEach(ttReveal => {
                            charboxDiv.removeChild(ttReveal);
                        });
                        charbox.weapon.div.innerHTML = '';
                        charbox.armour.div.innerHTML = '';
                        charbox.accessory.div.innerHTML = '';
                        charboxDiv.style.height = `${htmlFn.findLastBottom(charboxDiv,'stat-child') + 60}px`;
                        healthBar.removeEventListener('transitionend', onTransitionEnd);
                    } 
                }
            };
            healthBar.addEventListener('transitionend', onTransitionEnd);
        }
    });
}

function initiateCombat () {
    //initialise combat html elements
    gameContainer.innerHTML = `
    <div class="statbox-container" id="stat-enemy">
    </div>

    <div id="interface-container">
        <div class="status-container inter-child" id="status-container">
            <div class="status-message">
                A status message goes here.<br>
                This div disappears if there are no status messages to display.
            </div>
        </div>

        <div id="result-container" class="inter-child">
            <div class="result-message">
                Individual battle result messages go here.<br>
                This should not be visible before the results screen.
            </div>
        </div>

        <div class= "status-container inter-child" id="consequence-container">
            <div class="status-message">
                Consequence messages go here.<br>
                This should not be visible before the results screen.
            </div>
        </div>

        <div id="menu-battle-container" class="inter-child">
        </div>
    </div>

    <div class="statbox-container" id="stat-ally">
    </div>
    `;

    //assign variables to html elements
    statAlly = document.getElementById('stat-ally');
    statEnemy = document.getElementById('stat-enemy');
    statusContainer = document.getElementById('status-container');
    resultContainer = document.getElementById('result-container');
    interfaceContainer = document.getElementById('interface-container');
    conContainer = document.getElementById('consequence-container');
    menuBattle = document.getElementById('menu-battle-container');

    //refresh combat history and counters
    round = 0;
    turn = 0;
    combatHistory = [];
    

    //for all combat participants: roll init, undefine iteratedName, mark as not acted, mark alive as ready
    const combatArray = combat().sort((a, b) => a.uid - b.uid);
    combatArray.forEach (char => {
        char.iteratedName = undefined;
        char.acted = false;
        if (char.dead === false) {
            char.ready = true;
        }
        char.initRoll = (Math.random() * 10) + (Math.random() * 10);
        char.items.forEach(item => {
            if (item.limit) {
                item.limitCount = item.limit;
            }
        });
    });

    //check for duplicate names
    let nameArray = [];
    combatArray.forEach (char => {
        if (!nameArray.some(name => name.name === char.name)) {
            nameArray.push( {name: char.name, freq: 1} );
        } else {
            nameArray.find(name => name.name === char.name).freq += 1;
        }
    });

    //iterate letters at end of names if any repeats
    const repeatNames = nameArray.filter(name => name.freq > 1);
    repeatNames.forEach (name => {
        const namedChars = combatArray.filter(char => char.name === name.name);
        for (let i = 0; i < namedChars.length; ++i) {
            const suffix = String.fromCharCode(65 + i);
            namedChars[i].iteratedName = namedChars[i].name + ` ${suffix}`;
        }
    });

    //prep done, now initialise actual combat
    updateStatbox();
    updateStatus();
    combatRoundStart();
    combatTurnStart();
}

const initGame = {
    weapon: ['spear', 'jokeBook', 'sapphireStaff'],
    armour: ['leatherArmour', 'ironArmour', 'wizardRobes', 'rubberSuit', 'bladesmithApron', 'blacksmithApron'],
    item: ['potion'],
}

function initiateGame () {
    gameContainer.innerHTML = `
    <div id="menu-battle-container">
        <div class="menu-battle-column" id="battle-column1">
        </div>
        <div class="menu-battle-column" id="battle-column2">
        </div>
        <div class="menu-battle-column" id="battle-column3">
        </div>
    </div>`;
    column1 = document.getElementById('battle-column1');
    column2 = document.getElementById('battle-column2');
    column3 = document.getElementById('battle-column3');

    column1.innerHTML = `<div class="emphasis">Choose your weapon!</div>`;
    initGame.weapon.forEach(id => {
        column2.innerHTML
    });
}

function combatRoundStart () {
    round += 1;
    turn = 0;
    modTimeFn('round');
    checkExpire ('round'); //CHECK EXPIRING MODIFIERS
    const combatArray = combat();
    combatArray.forEach (char => {
        char.acted = false;
        if (char.dead === false) {
            char.ready = true;
        }
    });
}

function updateStatus (time) {
    statusContainer.innerHTML = '';
    conContainer.innerHTML = ''; 

    if (messages.weather && messages.celestial) {
        statusContainer.innerHTML += `<div class="status-message">${messages.weather} ${messages.celestial}</div>`;
    } else if (messages.weather) {
        statusContainer.innerHTML += `<div class="status-message">${messages.weather}</div>`;
    } else if (messages.celestial) {
        statusContainer.innerHTML += `<div class="status-message">${messages.celestial}</div>`;
    }

    messages.priority.forEach(message => {
        statusContainer.innerHTML += `<div class="status-message">${message}</div>`;
    });
    //if (messages.priority.length > 0) {
    //    const priority = messages.priority;
    //    if (priority.length === 1) {
    //        statusContainer.innerHTML += `<div class="status-message">${priority[0]}</div>`;
    //    } else if (priority.length === 2) {
    //        statusContainer.innerHTML += `<div id="status-priority-container"></div>`;
    //        const priorityContainer = document.getElementById('status-priority-container');
    //        priorityContainer.innerHTML += `<div class="status-char-group" id="priorityGroup0"><div class="status-message">${priority[0]}</div></div>`;
    //        priorityContainer.innerHTML += `<div class="status-char-group" id="priorityGroup1"><div class="status-message">${priority[1]}</div></div>`;
    //    } else if (priority.length >= 3) {
    //        statusContainer.innerHTML += `<div id="status-priority-container"></div>`;
    //        const priorityContainer = document.getElementById('status-priority-container');
    //        priorityContainer.innerHTML += `<div class="status-char-group" id="priorityGroup0"><div class="status-message"></div></div>`;
    //        priorityContainer.innerHTML += `<div class="status-char-group" id="priorityGroup1"><div class="status-message"></div></div>`;
    //        priorityContainer.innerHTML += `<div class="status-char-group" id="priorityGroup2"><div class="status-message"></div></div>`;
    //        priority.forEach((msg, index) => {
    //            const groupIndex = index % 3;
    //            const thisGroup = document.getElementById(`priorityGroup${groupIndex}`);
    //            thisGroup.innerHTML += `<div class="status-message">${msg}</div>`;
    //        });
    //    }
    //}
    if (time === 'playerTurn') {
        const allMessages = [...messages.status, ...messages.char[0]?.segArray ?? []];
        if (allMessages.length === 1) {
            statusContainer.innerHTML += `<div class="status-message">${allMessages[0]}</div>`;
        } else if (allMessages.length >= 2) {
            statusContainer.innerHTML += `<div id="status-char-container"></div>`;
            const charContainer = document.getElementById('status-char-container');
            charContainer.innerHTML += `<div class="status-char-group" id="charGroup0"><div class="status-message"></div></div>`;
            charContainer.innerHTML += `<div class="status-char-group" id="charGroup1"><div class="status-message"></div></div>`;
            allMessages.forEach((msg, index) => {
                const groupIndex = index % 2;
                const thisGroup = document.getElementById(`charGroup${groupIndex}`);
                thisGroup.innerHTML += `<div class="status-message">${msg}</div>`;
            });
        }
        messages.con.forEach(message => {
            conContainer.innerHTML += `<div class="status-message">${message}</div>`;
        });
    } else {
        messages.status.forEach(message => {
            statusContainer.innerHTML += `<div class="status-message">${message}</div>`;
        });
        if (messages.char.length === 1) {
            messages.char[0].segArray.forEach(message => {
                statusContainer.innerHTML += `<div class="status-message">${message}</div>`;
            });
        } else if (messages.char.length > 1) {
            statusContainer.innerHTML += `<div id="status-char-container"></div>`;
            const charContainer = document.getElementById('status-char-container');
            const allyChar = messages.char.filter(obj => obj.team === 'ally');
            const enemyChar = messages.char.filter(obj => obj.team === 'enemy');

            if (activeChar.team == 'ally') {
                allyChar.forEach(char => {
                    charContainer.innerHTML += `<div class="status-char-group" id="status${char.uid}"></div>`;
                    const charGroup = document.getElementById(`status${char.uid}`);
                    char.segArray.forEach(message => {
                        charGroup.innerHTML += `<div class="status-message">${message}</div>`;
                    });
                });
                enemyChar.forEach(char => {
                    charContainer.innerHTML += `<div class="status-char-group" id="status${char.uid}"></div>`;
                    const charGroup = document.getElementById(`status${char.uid}`);
                    char.segArray.forEach(message => {
                        charGroup.innerHTML += `<div class="status-message">${message}</div>`;
                    });
                });
            } else if (activeChar.team === 'enemy') {
                enemyChar.forEach(char => {
                    charContainer.innerHTML += `<div class="status-char-group" id="status${char.uid}"></div>`;
                    const charGroup = document.getElementById(`status${char.uid}`);
                    char.segArray.forEach(message => {
                        charGroup.innerHTML += `<div class="status-message">${message}</div>`;
                    });
                });
                allyChar.forEach(char => {
                    charContainer.innerHTML += `<div class="status-char-group" id="status${char.uid}"></div>`;
                    const charGroup = document.getElementById(`status${char.uid}`);
                    char.segArray.forEach(message => {
                        charGroup.innerHTML += `<div class="status-message">${message}</div>`;
                    });
                });
            }
        }
        resultContainer.style.position = 'absolute';
        const resultTop = Math.max((htmlFn.findPrevBottom(interfaceContainer, 'inter-child', resultContainer) + 10), 50);
        resultContainer.style.top = `${resultTop}px`;
    }
}

function combatTurnStart () {
    //adjust turn-specific info
    turn += 1;
    //erase containers
    menuBattle.innerHTML = '';
    resultContainer.innerHTML = '';
    statusContainer.innerHTML = '';
    dialogueContents = '';
    createMessage('reset');

    //determine c or start new round if none ready
    if (!combat().some(char => char.ready === true && char.dead === false)) {
        combatRoundStart();
    }
    const combatSort = combat().sort((a, b) => b.initiative - a.initiative);
    const c = combatSort.find(char => char.ready === true && char.dead === false);
    activeChar = c;
    modTimeFn('turnStart', c); //run all revent modifier turn start functions
    checkExpire ('turnStart', c); //check modifier expiry
    c.adjustConTurn(); //adjust char conditions (-1 or -2 condition.val)
    if (c.team === 'ally') {
        if (c.dead) {
            updateStatbox();
            createMessage('con', `${c.name} is killed!`);
            updateStatus('playerTurn');
            menuBattle.innerHTML = messages.continue;
        } else {
            playerTurn(c); //if c is an ally, create menu
        }
    } else if (c.team === 'enemy') {
        if (c.dead) {
            updateStatbox();
            createMessage('con', `${c.name} is killed!`);
            updateStatus();
            menuBattle.innerHTML = messages.continue;
        } else {
            c.checkOptions(); //if c is an enemy, run ai
        }
    }
}

function combatTurnEnd () {
    const c = activeChar;
    modTimeFn('turnEnd', c); //run all revent modifier turn end functions
    checkExpire ('turnEnd', c); //check modifier expiry
    activeChar = undefined;
    c.acted = true;
    c.ready = false;
    c.possibleOptions.forEach(opt => {
        opt.action.forEach(act => {
            act.targetList = undefined;
        });
    });
    resultContainer.innerHTML = '';
    dialogueContents = '';
    menuBattle.innerHTML = '';
    createMessage('reset');
    checkEffExpire('turn');
    if (ally.every(char => char.dead === true) || enemy.every(char => char.dead === true) || enemy.length === 0) {
        statusContainer.innerHTML = '';
        conContainer.innerHTML = '';
        resultContainer.innerHTML = '<br><br><strong>Game Over</strong><br>Refresh the page to play again.';
        return;
    }
    updateStatbox();
    combatTurnStart();
}

function playerTurn (c) {
    //update statboxes (after modifiers etc take effect)
    //statusContainer.style.display = 'block';
    //statusContainer.style.minHeight = '15px';
    updateStatbox();
    updateStatus('playerTurn');
    actionSelected = undefined;
    actionTypeSelected = undefined;
    examineSelected = undefined;

    //put column elements into menuBattle, making it visible
    menuBattle.innerHTML = `
    <div id="menu-battle-left">
        <div class="menu-battle-column" id="battle-column1"></div>
        <div class="menu-battle-column" id="battle-column2"></div>
    </div>
    <div id="menu-battle-right">
        <div class="menu-battle-column" id="battle-column3"></div>
    </div>`;
    column1 = document.getElementById('battle-column1');
    column2 = document.getElementById('battle-column2');
    column3 = document.getElementById('battle-column3');
    const menuLeft = document.getElementById('menu-battle-left');
    const menuRight = document.getElementById('menu-battle-right');
    menuBattle.style.position = 'absolute';
    menuBattle.style.top = `${htmlFn.findPrevBottom(interfaceContainer, 'inter-child', menuBattle) + 10}px`;

    //create battle menu interface elements
    column1.innerHTML = ` 
    <div id="announce-turn"><strong>${c.name}'s turn</strong></div>
    <button id="weaponButton"onclick="playerBattleMenu.selectAction(activeChar, activeChar.weapon)">Use ${c.weapon.name}</button>
    <button id="skillButton" onclick="playerBattleMenu.skillChoices(activeChar)">Use a skill</button>`;
    if (c.items.length > 0) {
        column1.innerHTML += `<button id="itemButton" onclick="playerBattleMenu.itemChoices(activeChar)">Use an item</button><br>`;
    } else if (c.items.length === 0) {
        column1.innerHTML += `<button id="itemButton" onclick="playerBattleMenu.itemChoices(activeChar)"><s>Use an item</s></button><br>`;
    }
    
    if (c.protag) {
        column1.innerHTML += `
        <button id="talkButton" onclick="playerBattleMenu.talk(activeChar)">Talk</button>
        <br>`;    
    }
    column1.innerHTML += `
    <button id="focusButton" onclick="playerBattleMenu.selectAction(activeChar, genericSkill.focus)">Focus</button>
    <button id="defendButton" onclick="playerBattleMenu.selectAction(activeChar, genericSkill.defend)">Defend</button>
    <button id="examineButton" onclick="playerBattleMenu.examine(activeChar)">Examine</button>
    `;
    charDesc(c);

    const announceDiv = document.getElementById('announce-turn');
    announceDiv.addEventListener('mouseenter', () => {
        column2.innerHTML = '';
        charDesc(c);
        leaveTarget();
        hoverTarget([c]);
    });
    announceDiv.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const weaponButton = document.getElementById('weaponButton');
    weaponButton.addEventListener('mouseenter', () => {
        playerBattleMenu.selectAction(c, c.weapon, true);
        leaveTarget();
    });
    weaponButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const skillButton = document.getElementById('skillButton');
    skillButton.addEventListener('mouseenter', () => {
        playerBattleMenu.skillChoices(activeChar, true);   
        leaveTarget();   
    });
    skillButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const itemButton = document.getElementById('itemButton');
    itemButton.addEventListener('mouseenter', () => {
        playerBattleMenu.itemChoices(activeChar, true);
        leaveTarget();  
    });
    itemButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const defendButton = document.getElementById('defendButton');
    defendButton.addEventListener('mouseenter', () => {
        playerBattleMenu.selectAction(c, genericSkill.defend, true);
        leaveTarget();
    });
    defendButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const focusButton = document.getElementById('focusButton');
    focusButton.addEventListener('mouseenter', () => {
        playerBattleMenu.selectAction(c, genericSkill.focus, true);
        leaveTarget();
    });
    focusButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    const examineButton = document.getElementById('examineButton');
    examineButton.addEventListener('mouseenter', () => {
        playerBattleMenu.examine(c, true);
        leaveTarget();
    });
    examineButton.addEventListener('mouseleave', () => {
        resetSelection(c);
    });
    if (c.protag) {
        const talkButton = document.getElementById('talkButton');
        talkButton.addEventListener('mouseenter', () => {
            playerBattleMenu.talk(c, true);
            leaveTarget();
        });
        talkButton.addEventListener('mouseleave', () => {
            resetSelection(c);
        });
    }
}

//ADD SUPPORT FOR INCLUDING DEAD TARGETS IN TARGETING MENU
const playerBattleMenu = {
    selectAction: function (c, action, mouseover) {
        if (!mouseover) {
            actionSelected = action;
            actionTypeSelected = undefined;
            examineSelected = undefined;
        }
        //create targetList array in first act of action
        const act = action.action[0];
        act.targetList = [];
        column3.innerHTML = descMenu(action, c);

        //update column2 to show target(s)
        let targetOptions = [];
        let targetButton;
        column2.innerHTML = `
        <span class="menu-battle-big"><strong>Select target:</strong></span>
        `;
        const messageNoValidTargets = '<strong>No valid targets available for this action.</strong>';
        switch (action.selectTarget) {
            case 'enemySingle':
            case 'allySingle':
                targetOptions = [];
                if (action.selectTarget === 'enemySingle') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetOptions = targetTeam(c, 'enemy');
                    } else if (action.selectDead) {
                        targetOptions = targetTeam(c, 'enemy', 'include');
                    } else if (action.selectDeadOnly) {
                        targetOptions = targetTeam(c, 'enemy', 'only');
                    }
                } else if (action.selectTarget === 'allySingle') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetOptions = targetTeam(c, 'ally');
                    } else if (action.selectDead) {
                        targetOptions = targetTeam(c, 'ally', 'include');
                    } else if (action.selectDeadOnly) {
                        targetOptions = targetTeam(c, 'ally', 'only');
                    }
                    if (action.selectOther) {
                        targetOptions = targetOptions.filter(char => char.uid !== c.uid);
                    }
                }
                //break if no valid targets
                if (targetOptions.length === 0) {
                    column2.innerHTML = messageNoValidTargets;
                    break;
                }
                targetOptions.forEach (target => {
                    column2.innerHTML += `<button id="actTarget${target.uid}">${target.name}</button>`;
                });
                targetOptions.forEach (target => {
                    targetButton = document.getElementById(`actTarget${target.uid}`);
                    targetButton.addEventListener('click', function() {
                        act.targetList = [target];
                        leaveTarget();
                        initiateResults(c, action);
                    });
                    targetButton.addEventListener('mouseover', function () {
                        hoverTarget([target]);
                    });
                    targetButton.addEventListener('mouseleave', function () {
                        leaveTarget();
                    });
                });
                break;
            case 'enemyTeam':
            case 'allyTeam':
                column2.innerHTML += '<button id="actTargetTeam"></button>';
                targetButton = document.getElementById('actTargetTeam');
                if (action.selectTarget === 'enemyTeam') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetButton.textContent += 'All enemies';
                        targetOptions = targetTeam(c, 'enemy');
                    } else if (action.selectDead) {
                        targetButton.textContent += 'All enemies';
                        targetOptions = targetTeam(c, 'enemy', 'include');
                    } else if (action.selectDeadOnly) {
                        targetButton.textContent += 'All dead enemies';
                        targetOptions = targetTeam(c, 'enemy', 'only');
                    }
                } else if (action.selectTarget === 'allyTeam') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetButton.textContent += 'All allies';
                        targetOptions = targetTeam(c, 'ally');
                    } else if (action.selectDead) {
                        targetButton.textContent += 'All allies';
                        targetOptions = targetTeam(c, 'ally', 'include');
                    } else if (action.selectDeadOnly) {
                        targetButton.textContent += 'All dead allies';
                        targetOptions = targetTeam(c, 'ally', 'only');
                    }
                    if (action.selectOther) {
                        targetOptions = targetOptions.filter(char => char.uid !== c.uid);
                    }
                }
                //break if no valid targets
                if (targetOptions.length === 0) {
                    column2.innerHTML = messageNoValidTargets;
                    break;
                }
                targetButton.addEventListener('click', function() {
                    act.targetList = targetOptions;
                    leaveTarget();
                    initiateResults(c, action);
                });
                targetButton.addEventListener('mouseover', function () {
                    hoverTarget(targetOptions);
                });
                targetButton.addEventListener('mouseleave', function () {
                    leaveTarget();
                });
                break;
            case 'enemyRandom':
            case 'allyRandom':
                column2.innerHTML += '<button id="actTargetRandom"></button>';
                targetButton = document.getElementById('actTargetRandom');

                if (action.selectTarget === 'enemyRandom') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetButton.textContent = 'Random enemy';
                        targetOptions = targetTeam(c, 'enemy');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random enemies';
                        }
                    } else if (action.selectDead) {
                        targetButton.textContent = 'Random enemy';
                        targetOptions = targetTeam(c, 'enemy', 'include');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random enemies';
                        }
                    } else if (action.selectDeadOnly) {
                        targetButton.textContent = 'Random dead enemy';
                        targetOptions = targetTeam(c, 'enemy', 'only');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random dead enemies';
                        }
                    }
                } else if (action.selectTarget === 'allyRandom') {
                    if (!action.selectDead && !action.selectDeadOnly) {
                        targetButton.textContent = 'Random ally';
                        targetOptions = targetTeam(c, 'ally');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random allies';
                        }
                    } else if (action.selectDead) {
                        targetButton.textContent = 'Random ally';
                        targetOptions = targetTeam(c, 'ally', 'include');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random allies';
                        }
                    } else if (action.selectDeadOnly) {
                        targetButton.textContent = 'Random dead ally';
                        targetOptions = targetTeam(c, 'ally', 'only');
                        if (action.randomNumber || action.randomMin) {
                            targetButton.textContent = 'Random dead allies';
                        }
                    }
                    if (action.selectOther) {
                        targetOptions = targetOptions.filter(char => char.uid !== c.uid);
                    }
                }
                //break if no valid targets
                if (targetOptions.length === 0) {
                    column2.innerHTML = messageNoValidTargets;
                    break;
                }
                targetButton.addEventListener('click', function() {
                    if (!action.randomNumber && !action.randomMin) {
                        const targetIndex = Math.floor(Math.random() * targetOptions.length);
                        act.targetList = [targetOptions[targetIndex]];
                    } else if (action.randomNumber) {
                        for (let i = 1; (i <= action.randomNumber && targetOptions.length > 0); ++i) {
                            const targetIndex = Math.floor(Math.random() * targetOptions.length);
                            act.targetList.push(targetOptions[targetIndex]);
                            if (!action.targetRepeat) {
                                targetOptions.splice(targetIndex, 1);
                            }
                        }
                    } else if (action.randomMin && action.randomMax) {
                        const randomRange = (action.randomMax - action.randomMin);
                        const randomAdd = Math.floor(Math.random () * (randomRange + 1));
                        const targetCount = action.randomMin + randomAdd;
                        for (let i = 1; (i <= targetCount && targetOptions.length > 0); ++i) {
                            const targetIndex = Math.floor(Math.random() * targetOptions.length);
                            act.targetList.push(targetOptions[targetIndex]);
                            if (!action.targetRepeat) {
                                targetOptions.splice(targetIndex, 1);
                            }
                        }
                    }
                    leaveTarget();
                    initiateResults(c, action);
                });
                targetButton.addEventListener('mouseover', function () {
                    hoverTarget(targetOptions);
                });
                targetButton.addEventListener('mouseleave', function () {
                    leaveTarget();
                });
                break;
            case 'yourself':
                column2.innerHTML += `<button id="actTargetYourself">Yourself (${c.name})</button>`;
                targetButton = document.getElementById('actTargetYourself');
                targetButton.addEventListener('click', function() {
                    act.targetList = [c];
                    leaveTarget();
                    initiateResults(c, action);
                });
                targetButton.addEventListener('mouseover', function () {
                    hoverTarget([c]);
                });
                targetButton.addEventListener('mouseleave', function () {
                    leaveTarget();
                });
                break;
            case 'everyone':
                if (!action.selectDeadOnly && !action.selectOther) {
                    column2.innerHTML += '<button id="actTargetEveryone">Everyone</button>';
                } else if (action.selectOther) {
                    column2.innerHTML += '<button id="actTargetEveryone">Everyone else</button>';
                } else if (action.selectDeadOnly) {
                    column2.innerHTML += '<button id="actTargetEveryone">All dead characters</button>';
                }
                if (!action.selectDead && !action.selectDeadOnly) {
                    targetOptions = combat().filter(char => char.dead === false);
                } else if (action.selectDead) {
                    targetOptions = combat();
                } else if (action.selectDeadOnly) {
                    targetOptions = combat().filter(char => char.dead === true);
                }
                if (action.selectOther) {
                    targetOptions = targetOptions.filter(target => target.uid !== c.uid);
                }
                targetButton = document.getElementById('actTargetEveryone');
                targetButton.addEventListener('click', function() {
                    act.targetList = targetOptions;
                    leaveTarget();
                    initiateResults(c, action);
                });
                targetButton.addEventListener('mouseover', function () {
                    hoverTarget([...targetOptions]);
                });
                targetButton.addEventListener('mouseleave', function () {
                    leaveTarget();
                });
                break;
            case 'anyone':
                if (!action.selectDead && !action.selectDeadOnly) {
                    targetOptions = combat().filter(char => char.dead === false);
                } else if (action.selectDead) {
                    targetOptions = combat();
                } else if (action.selectDeadOnly) {
                    targetOptions = combat().filter(char => char.dead === true);
                }
                if (action.selectOther) {
                    targetOptions = targetOptions.filter(target => target.uid !== c.uid);
                }
                targetOptions.forEach (target => {
                    column2.innerHTML += `<button id="actTarget${target.uid}">${target.name}</button>`;
                });
                targetOptions.forEach (target => {
                    targetButton = document.getElementById(`actTarget${target.uid}`);
                    targetButton.addEventListener('click', function() {
                        act.targetList = [target];
                        leaveTarget();
                        initiateResults(c, action);
                    });
                    targetButton.addEventListener('mouseover', function () {
                        hoverTarget([target]);
                    });
                    targetButton.addEventListener('mouseleave', function () {
                        leaveTarget();
                    });
                });
                break;
        }
    },
    skillChoices: function (c, mouseover) {
        if (!mouseover) {
            actionTypeSelected = 'skills';
            actionSelected = undefined;
            examineSelected = undefined;
        }
        column3.innerHTML = '';
        column2.innerHTML = '<span class="menu-battle-big"><strong>Choose a skill:</strong></span>';
        c.skills.forEach(skill => {
            column2.innerHTML += `<button id="skill${skill.uid}">${skill.name}</button>`;
        });
        c.skills.forEach(skill => {
            const skillButton = document.getElementById(`skill${skill.uid}`);
            skillButton.addEventListener('click', function() {
                playerBattleMenu.selectAction(c, skill);
            });
            skillButton.addEventListener('mouseenter', () => {
                console.log(`mouseenter triggered!!!`);
                column3.innerHTML = `${descMenu(skill, c)}`;         
            });
        });
    },
    itemChoices: function (c, mouseover) {
        if (!mouseover) {
            actionTypeSelected = 'items';
            actionSelected = undefined;
            examineSelected = undefined;
        }
        column3.innerHTML = '';
        column2.innerHTML = '<span class="menu-battle-big"><strong>Choose an item:</strong></span>';
        let _itemChoices = c.items;
        _itemChoices = _itemChoices.filter(item => !item.limit || item.limitCount > 0);
        if (_itemChoices.length === 0) {
            column2.innerHTML += `<br>You have no items.`;
            return;
        }
        _itemChoices.forEach(item => {
            if (item.stock) {
                column2.innerHTML += `<button id="item${item.uid}">${item.name} (x${item.stock} stock)</button>`;
            } else if (item.limit) {
                column2.innerHTML += `<button id="item${item.uid}">${item.name} (x${item.limitCount} uses left)</button>`;
            } else if (item.unlimited) {
                column2.innerHTML += `<button id="item${item.uid}">${item.name}</button>`;
            }
        });
        _itemChoices.forEach(item => {
            const itemButton = document.getElementById(`item${item.uid}`);
            itemButton.addEventListener('click', function() {
                playerBattleMenu.selectAction(c, item);
            });
            itemButton.addEventListener('mouseenter', () => {
                console.log(`mouseenter triggered!!!`);
                column3.innerHTML = `${descMenu(item, c)}`;         
            });
        });
    },
    talk: function (c, mouseover) {
        if (!mouseover) {
            actionTypeSelected = 'talk';
            actionSelected = undefined;
            examineSelected = undefined;
        }
        column3.innerHTML = `
        <span><span class="menu-battle-big"><strong>Talk</strong></span>
        <br>Start dialogue with an opponent.
        <br><br>Characters who like you, regard you highly, or are intimidated by you, may surrender or join your union.</span>
        `;
        column2.innerHTML = '<span class="menu-battle-big"><b>Who do you want to talk to?</b></span>';
        let targetOptions = targetTeam(c, 'enemy');
        targetOptions = targetOptions.filter(target => target.canTalk);
        if (targetOptions.length === 0) {
            column2.innerHTML += `There's no one to talk to.`;
        } else {
            targetOptions.forEach (target => {
                column2.innerHTML += `<button id="actTarget${target.uid}">${target.name}</button>`;
            });
            targetOptions.forEach (target => {
                targetButton = document.getElementById(`actTarget${target.uid}`);
                targetButton.addEventListener('click', function() {
                    initiateConversation(c, target);
                });
            });
        }
    },
    examine: function (c, mouseover, reset) {
        if (reset && examineSelected) {
            console.log(`resetting examine, hover target is ${examineSelected.name}`);
            leaveTarget();
            examineChar(examineSelected);
            hoverTarget([examineSelected]);
        } else if (!mouseover && !reset) {
            console.log('clicked examine');
            actionTypeSelected = 'examine';
            actionSelected = undefined;
            examineSelected = undefined;
            column3.innerHTML = `<div class="menu-battle-big"><b>Examine</b>
            <br>Examine a character's equipment.</div>`;
        } else if (mouseover || !examineSelected) {
            console.log('mouseover reset examine');
            column3.innerHTML = `<div class="menu-battle-big"><b>Examine</b>
            <br>Examine a character's equipment.</div>`;
        }
        column2.innerHTML = '<div class="menu-battle-big"><strong>Who do you want to examine?</strong></div>';
        const targetOptions = combat();
        targetOptions.forEach (target => {
            column2.innerHTML += `<button id="actTarget${target.uid}">${target.name}</button>`;
        });
        targetOptions.forEach (target => {
            targetButton = document.getElementById(`actTarget${target.uid}`);
            targetButton.addEventListener('click', () => {
                examineSelected = target;
                leaveTarget();
                examineChar(target);
                hoverTarget([target]);
            });
            targetButton.addEventListener('mouseover', () => {
                leaveTarget();
                examineChar(target);
                hoverTarget([target]);
            });
            targetButton.addEventListener('mouseleave', () => {
                resetSelection(c);
                leaveTarget();
                if (examineSelected) {
                    hoverTarget([examineSelected]);
                }
            });
        });
    }
};

function dialogue (c, t) {
    console.log(`initating dialogue between ${c.name} and ${t.name}`);
    const convo = t.convo;
    convo.options = [];

    function ignored (c, t) {
        console.log(`${t.name} is ignoring you!`);
        const ignoredText = t.convo.ignoredText;
        const random = Math.floor(Math.random() * ignoredText.length);
        createMessage('dialogue', ignoredText[random].textFn(c, t));
        updateStatbox();
        const printMessages = [...messages.result, messages.continue];
        printWithDelay(printMessages, 800, resultContainer);
    }

    if (convo.talkContinue) {
        convo.talkStop = true; //this is last topic
    }

    if (t.sentiment <= 0) {
        ignored(c, t); //target doesn't respond
        return;
    }

    if (convo.speakNext === false) { // player's turn to choose topic
        convo.speakNext = true;

        let playerTopics = t.topics('player');
        if (playerTopics.length === 0) {
            ignored(c, t);
            return;
        }

        const initiatePlayer = t.convo.initiatePlayer;
        let random = Math.floor(Math.random() * initiatePlayer.length);
        createMessage('dialogue', initiatePlayer[random].textFn(c, t));

        for (let i = 1; i <= 3 && playerTopics.length > 0; ++i) {
            random = Math.floor(Math.random() * playerTopics.length);
            const topic = playerTopics[random];
            playerTopics.splice(random, 1);
            random = Math.floor(Math.random() * topic.choiceOptions.length);
            topic.choiceText = topic.choiceOptions[random].textFn(c, t);
            convo.options.push(topic);
        }

        createMessage('result', `<strong>What do you say?</strong>`);
        convo.options.forEach(topic => {
            createMessage('choice', topic.choiceText, topic);
        });

        const printMessages = [...messages.result];
        printWithDelay(printMessages, 700, resultContainer).then(() => {
            messages.choice.forEach(choice => {
                resultContainer.innerHTML += choice;
            });
            convo.options.forEach(topic => {
                const div = document.getElementById(`choice${topic.index}`);
                div.addEventListener('click', function() {
                    resultContainer.innerHTML = '';
                    createMessage('talkContinue'); //move dialogue into results as one div
                    createMessage('dialogue', `${c.name}: ${topic.choiceText}`);
    
                    const result = topic.resultFn(c, t);
                    createMessage('dialogue', result.message);
                    if (result.message2) {
                        createMessage('dialogue', result.message2);
                    }
    
                    convo.usedPlayer.push(topic.index);
                    if (convo.talkContinue && !convo.talkStop) {
                        updateStatbox();
                        dialogue(c, t);
                    } else { //end conversation
                        updateStatbox();
                        const printMessages = [...messages.result, messages.continue];
                        printWithDelay(printMessages, 700, resultContainer);
                        return;
                    }
                });
            });
        });
    } else if (convo.speakNext === true) { //target's turn to choose topic
        convo.speakNext = false;
        const targetTopics = t.topics('target');

        if (targetTopics.length === 0) {
            ignored(c, t);
            return;
        }

        const initiateTarget = t.convo.initiateTarget;
        let random = Math.floor(Math.random() * initiateTarget.length);
        createMessage('dialogue', initiateTarget[random].textFn(c, t));
    
        random = Math.floor(Math.random() * targetTopics.length);
        const topic = targetTopics[random];
        convo.usedTarget.push(topic.index);
        createMessage('dialogue', `${topic.startFn(c, t)}`);
        createMessage('result', `<strong>How do you respond?</strong>`);

        topic.answerOptions.forEach(answer => {
            random = Math.floor(Math.random() * answer.choiceOptions.length);
            answer.choiceText = answer.choiceOptions[random].textFn(c, t);
            createMessage('choice', answer.choiceText, answer);
        });

        const printMessages = [...messages.result];
        printWithDelay(printMessages, 700, resultContainer).then(() => {
            messages.choice.forEach(choice => {
                resultContainer.innerHTML += choice;
            });
            topic.answerOptions.forEach(answer => {
                const div = document.getElementById(`choice${answer.index}`);
                div.addEventListener('click', function() {
                    resultContainer.innerHTML = '';
                    console.log(`messages.result before talkContinue:`);
                    console.log(messages.result);
                    console.log(`messages.dialogue before talkContinue:`);
                    console.log(messages.dialogue);
                    createMessage('talkContinue'); //move dialogue into results as one div
                    createMessage('dialogue', `${c.name}: ${answer.choiceText}`);
    
                    const result = answer.resultFn(c, t);
                    createMessage('dialogue', result.message);
                    if (result.message2) {
                        createMessage('dialogue', result.message2);
                    }
    
                    if (convo.talkContinue && !convo.talkStop) {
                        updateStatbox();
                        dialogue(c, t);
                    } else { //end conversation
                        updateStatbox();
                        const printMessages = [...messages.result, messages.continue];
                        printWithDelay(printMessages, 700, resultContainer);
                        return;
                    }
                });
            });
        });
    }
}

const genericDialogue = {
    ignoredText: [
        { textFn: function (c, t) { return `${c.name} calls out to ${t.name}, but ${t.he} doesn't respond.`; } },
        { textFn: function (c, t) { return `${c.name} shouts and waves ${c.his} hands at ${t.name}, but ${t.he} doesn't respond.`; } },
        { textFn: function (c, t) { return `${c.name} fails to get ${t.name}'s attention.`; } },
        { textFn: function (c, t) { return `${c.name} tries to talk to ${t.name}, but they aren't paying attention.`; } },
        { textFn: function (c, t) { return `${t.name} is ignoring ${c.name}.`; } }
    ],
    initiatePlayer: [
        { textFn: function (c, t) { return `${t.name} is listening.`; } },
        { textFn: function (c, t) { return `${c.name} has ${t.name}'s attention.`; } },
        { textFn: function (c, t) { return `${t.name} looks at ${c.name} expectantly.`; } },
        { textFn: function (c, t) { return `${t.name} is waiting for ${c.name} to say something.`; } },
        { textFn: function (c, t) { return `${t.name} hesitates, letting ${c.name} speak.`; } },
    ],
    initiateTarget: [
        { textFn: function (c, t) { return `${t.name} wants to say something.`; } },
        { textFn: function (c, t) { return `${t.name} has something to say.`; } },
        { textFn: function (c, t) { return `${t.name} starts talking.`; } },
        { textFn: function (c, t) { return `${t.name} speaks up.`; } }
    ]
}

/*
{id: 'blankPlayer',
    choiceOptions: [
        { textFn: function (c, t) { return `""`; } },
        { textFn: function (c, t) { return `""`; } }       
    ],
    resultFn: function (c, t) {
        const convo = t.convo;
        let resultOptions;
        switch (t.personality) {
            default:
                resultOptions = [
                    { textFn: function (c, t) { return `${t.name}: ""`; } },
                    { textFn: function (c, t) { return `${t.name}: ""`; } },
                ];  
                break;
        }
        let random = Math.floor(Math.random() * resultOptions.length);
        const message = `${resultOptions[random].textFn(c, t)}`;
        return { message: message};
    }
}


{id: 'blankTarget',
    startFn: function (c,t ) {
        let resultOptions = [
            { textFn: function (c, t) { return `${t.name}: ""`; } },
            { textFn: function (c, t) { return `${t.name}: ""`; } }
        ];
        const random = Math.floor(Math.random() * resultOptions.length);
        return resultOptions[random].textFn(c, t);
    },
    answerOptions: [
        {id: 'blankAnswer1',
            choiceOptions: [
                { textFn: function (c, t) { return `""`; } },
                { textFn: function (c, t) { return `""`; } }
            ],
            resultFn: function (c, t) {
                let resultOptions;
                const convo = t.convo;
                switch (t.personality) {
                    default:
                        resultOptions = [
                            { textFn: function (c, t) { return `${t.name}: ""`; } },
                            { textFn: function (c, t) { return `${t.name}: ""`; } }
                        ];
                        break;
                }
                const random = Math.floor(Math.random() * resultOptions.length);
                return { message: resultOptions[random].textFn(c, t) };
            }
        },
        {id: 'blankAnswer2',
            choiceOptions: [
                { textFn: function (c, t) { return `""`; } },
                { textFn: function (c, t) { return `""`; } }
            ],
            resultFn: function (c, t) {
                let resultOptions;
                const convo = t.convo;
                switch (t.personality) {
                    default:
                        resultOptions = [
                            { textFn: function (c, t) { return `${t.name}: ""`; } },
                            { textFn: function (c, t) { return `${t.name}: ""`; } }
                        ];
                        break;
                }
                const random = Math.floor(Math.random() * resultOptions.length);
                return { message: resultOptions[random].textFn(c, t) };
            }
        }
    ]
}

{id: 'blankTarget',
    startFn: function (c,t ) {
        let resultOptions = [
            { textFn: function (c, t) { return `${t.name}: ""`; } },
            { textFn: function (c, t) { return `${t.name}: ""`; } }
        ];
        const random = Math.floor(Math.random() * resultOptions.length);
        return resultOptions[random].textFn(c, t);
    },
    answerOptions: [
        {id: 'blankAnswer1',
            choiceOptions: [
                { textFn: function (c, t) { return `""`; } },
                { textFn: function (c, t) { return `""`; } }
            ],
            resultFn: function (c, t) {
                let resultOptions;
                const convo = t.convo;
                resultOptions = [
                    { textFn: function (c, t) { return `${t.name}: ""`; } },
                    { textFn: function (c, t) { return `${t.name}: ""`; } }
                ];
                const random = Math.floor(Math.random() * resultOptions.length);
                return { message: resultOptions[random].textFn(c, t) };
            }
        },
        {id: 'blankAnswer2',
            choiceOptions: [
                { textFn: function (c, t) { return `""`; } },
                { textFn: function (c, t) { return `""`; } }
            ],
            resultFn: function (c, t) {
                let resultOptions;
                const convo = t.convo;
                resultOptions = [
                    { textFn: function (c, t) { return `${t.name}: ""`; } },
                    { textFn: function (c, t) { return `${t.name}: ""`; } }
                ];
                const random = Math.floor(Math.random() * resultOptions.length);
                return { message: resultOptions[random].textFn(c, t) };
            }
        }
    ]
}

 */

const baseDialogue = {
    merc: {
        ignoredText: [...genericDialogue.ignoredText],
        initiatePlayer: [...genericDialogue.initiatePlayer],
        initiateTarget: [...genericDialogue.initiateTarget],
        playerTopics: [
            {id: 'askName',
                choiceOptions: [
                    { textFn: function (c, t) { return `"What's your name?"`; } },
                    { textFn: function (c, t) { return `"What is your name?"`; } },
                    { textFn: function (c, t) { return `"What name do you use?"`; } },
                    { textFn: function (c, t) { return `"What should I call you?"`; } },
                    { textFn: function (c, t) { return `"Who are you? What's your name?"`; } }           
                ],
                resultFn: function (c, t) {
                    t.sentiment += 2;
                    const convo = t.convo;
                    convo.talkContinue = true;
                    let resultOptions;
                    switch (t.personality) {
                        default:
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "${t.realName}. You are?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'm ${t.realName}. And you are?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "${t.realName}. Who's asking?"`; } }
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    t.knownName = t.realName;
                    const message2Options = [
                        { textFn: function (c, t) { return `${c.name} introduces ${c.himself}.`; } }
                    ];
                    random = Math.floor(Math.random() * message2Options.length);
                    const message2 = `${message2Options[random].textFn(c, t)}`;
                    return { message: message, message2: message2};
                }
            },
            {id: 'baronDepose',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Should the baron lord be overthrown?"`; } },
                    { textFn: function (c, t) { return `"Should the baron lord be deposed?"`; } }
                ],
                resultFn: function (c, t) {
                    let resultOptions;
                    const convo = t.convo;
                    switch (t.personality) {
                        case 'loyal':
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "That talk will get you killed."`; } },
                                { textFn: function (c, t) { return `${t.name} looks shocked.<br>${t.name}: "No wonder the baron's signed your death warrant."`; } }
                            ];
                            break;
                        case 'disloyal':
                            t.sentiment += 2;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} smiles.<br>${t.name}: "It'll happen eventually. The baron lord is an idiot."`; } },
                                { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "Of course. He's only an incredibly wealthy fool."`; } }
                            ];
                            break;
                        default:
                            t.sentiment += 1;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Good luck with that. He's a very wealthy and very powerful man."`; } },
                                { textFn: function (c, t) { return `${t.name}: "As long as the alternative isn't worse."`; } }
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'whereRatherBe',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Where would you rather be right now?"`; } },
                    { textFn: function (c, t) { return `"What do you wish you were doing right now?"`; } }       
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    switch (t.personality) {
                        default:
                            t.sentiment += 1;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "I'd rather be drinking."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'd rather be making love."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'd rather be anywhere else."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'd rather be home with my family."`; } }
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'howRule',
                choiceOptions: [
                    { textFn: function (c, t) { return `"How should a lord or baron treat their subjects?"`; } },
                    { textFn: function (c, t) { return `"How should a lord or baron rule their subjects?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    switch (t.personality) {
                        case 'disloyal':
                            t.sentiment += 2;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "With their best interests in mind and at heart. Unlike my employer."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Not like baron Dennis. They should rule with grace and mercy."`; } }
                            ];  
                            break;
                        default:
                            t.sentiment += 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "It should be give and take."`; } },
                                { textFn: function (c, t) { return `${t.name}: "They should be generous but also shrewd."`; } }
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'worthDying',
                choiceOptions: [
                    { textFn: function (c, t) { return `"What is worth dying for?"`; } },
                    { textFn: function (c, t) { return `"What's worth dying for?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    switch (t.personality) {
                        case 'disloyal':
                            t.sentiment += 2;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "I don't know. My employer is a tyrant, and I'll probably die serving him."`; } },
                                { textFn: function (c, t) { return `${t.name}: "What is there to believe in? Everything is fucked."`; } }
                            ];  
                            break;
                        default: 
                        t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "What do you expect me to say? Love? Justice?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "I don't want to die for a cause. I want to die of old age."`; } }
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'believeAstrology',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Do you believe in astrology?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    const coinFlip = Math.floor(Math.random() * 2);
                    switch (t.personality) {
                        case 'disloyal':
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Maybe the stars influence us, but astrologers can't predict the future.."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I don't know. Not really?"`; } }
                            ];
                            break;
                        default:
                            if (coinFlip === 0) {
                                t.sentiment += 2;
                                convo.talkContinue = true;
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "Yes. The best advisor is a good astrologer."`; } },
                                    { textFn: function (c, t) { return `${t.name}: "For sure. It's a science."`; } }
                                ];
                            } else if (coinFlip === 1) {
                                t.sentiment -= 1;
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "Astrologers are either idiots or charlatans."`; } },
                                    { textFn: function (c, t) { return `${t.name}: "Not at all."`; } }
                                ];
                            }
                            break;
                    }

                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'joinUnion',
                req: ['sentiment15'],
                choiceOptions: [
                    { textFn: function (c, t) { return `"You should join us."`; } },
                    { textFn: function (c, t) { return `"You should join our union."`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    let success = false;
                    switch (t.personality) {
                        case 'loyal':
                            const successGoal = 14 + (Math.random() * 5);
                            if (t.sentiment > successGoal && t.currentHp / t.maxHp < 0.5) {
                                success = true;
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "I'll join you. Please, just don't kill me."`; } },
                                    { textFn: function (c, t) { return `${t.name} thinks for a moment.<br>${t.name}: "Against my better judgement, I'll join you."`; } },
                                ];
                            } else {
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "I can't join you. They'd issue warrant for my execution."`; } },
                                    { textFn: function (c, t) { return `${t.name}: "I can't join you. I'd be killed for treason."`; } },
                                ]; 
                            }
                            break;
                        default:
                            success = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Why not? You seem like good company."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Alright. I'll join you."`; } },
                            ];  
                            break;
                    }
                    let random = Math.floor(Math.random() * resultOptions.length);
                    let message = `${resultOptions[random].textFn(c, t)}`;
                    if (success) {
                        message += `<br>${t.name} joins your union!`;
                        t.team = 'ally';
                        const tIndex = enemy.findIndex(enemy => enemy.uid === t.uid);
                        enemy.splice(tIndex, 1);
                        ally.push(t);
                        t.acted = true;
                        t.ready = false;
                        if (t.knownName !== t.realName) {
                            const introOptions = [
                                { textFn: function (c, t) { return `${t.name}: "My name is ${t.realName}. Good to meet you."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'm ${t.realName}. Thanks for having me."`; } },
                            ];
                            random = Math.floor(Math.random() * introOptions.length);
                            message += `<br>${introOptions[random].textFn(c, t)}`;
                            t.knownName = t.realName;
                        };
                    }
                    return { message: message};
                }
            }
        ],
        targetTopics: [
            {id: 'penOrSword',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Which determines the course of history? The pen or the blade?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Which is mightier, the pen or the blade?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'blade',
                        choiceOptions: [ { textFn: function (c, t) { return `"The blade."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Of course. Severed hands write nothing."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "It's just the way of the world."`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You're right. Words alone rarely change the world."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Both are useful tools, but I agree.`; } }
                                    ];
                                    break;
                            }
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'pen',
                        choiceOptions: [ { textFn: function (c, t) { return `"The pen."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Let's see if I can change your mind."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "It doesn't really matter. I could kill you with either one."`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Once I agreed with you, but not any more."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Are you just saying that because it sounds noble?"`; } }
                                    ];
                                    break;
                            }
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'equal',
                        choiceOptions: [ { textFn: function (c, t) { return `"Both are equal."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment -= 1;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You're wrong. The blade kills much faster."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Come on. Which would you rather see me holding?"`; } }
                                    ];
                                    break;
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "That's cheating. You were supposed to choose one."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I'd rather be subject to slander than slaughter."`; } }
                                    ];
                                    break;
                            }
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'doYouGamble',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Are you a gambler?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "You like to gamble? Make wagers, play cards?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"From time to time."`; } },
                            { textFn: function (c, t) { return `"I've been known to dabble."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} smiles.<br>${t.name}: "I could tell just by looking at you."`; } },
                                        { textFn: function (c, t) { return `${t.name} grins.<br>${t.name}: "I hope you're better at cards than you are at fighting."`; } }
                                    ];
                                    break;
                                case 'disloyal':
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "I miss the days when I could gamble away a paycheck without care. Now I barely scrape by."`; } },
                                        { textFn: function (c, t) { return `${t.name} grins.<br>${t.name}: "Shame we're fighting. I'm itching for a good game of cards."`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} smiles.<br>${t.name}: "I do enjoy a good wager."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Of course. You seem the type."`; } }
                                    ];
                                    break;
                            }
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Not my thing."`; } },
                            { textFn: function (c, t) { return `"Not interested."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} looks disappointed.<br>${t.name}: "You're boring."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Then we are two very different people."`; } }
                                    ];
                                    break;
                                case 'disloyal':
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "If only I could say the same."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I'm good at gambling but not winning."`; } }
                                    ];
                                    break;
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Not a risk taker?"`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I find most games boring when there's no stakes involved."`; } }
                                    ];
                                    break;
                            }
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'whyHated',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "So why does baron Dennis want you killed?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Why has baron Dennis signed a warrant for your death?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'vocal',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I speak against tyrants, and he is one."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'loyal':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Your mouth will get you killed."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I see. You don't know when to shut up."`; } }
                                    ];
                                    break;
                                case 'disloyal':
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} smiles.<br>${t.name}: "Fair enough."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "A good reason to die."`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "And you came here anyway? This is his domain."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "You're certainly committed to your cause."`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'scared',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"He's afraid of me."`; } },
                            { textFn: function (c, t) { return `"He fears me."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'loyal':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} smirks.<br>${t.name}: "Unlikely."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Well, I'm not afraid of you."`; } }
                                    ];
                                    break;
                                case 'disloyal':
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "I'm intrigued."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Well, I hope it's for good reason."`; } }
                                    ];
                                    break;
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Hm... I'm not sure I believe you."`; } },
                                        { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "You really think baron Dennis fears you?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'dontKnow',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I don't know."`; } },
                            { textFn: function (c, t) { return `"I have no idea."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} chortles.<br>${t.name}: "Isn't life a bitch?"`; } },
                                        { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "Sounds about right."`; } }
                                    ];
                                    break;
                                case 'loyal':
                                    t.sentiment -= 1;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You've got to be kidding."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "You can't be serious."`; } }
                                    ];
                                    break;
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Seriously? I don't know if I should believe you."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Are you being honest, or just avoiding the question?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'drumsOfWar',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "The world is changing. Do you feel the beating of the drums of war?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Yes. I can feel it."`; } },
                            { textFn: function (c, t) { return `"I feel it."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "We live in uncertain times."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Things will get worse before they get better."`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Nothing has changed."`; } },
                            { textFn: function (c, t) { return `"It's always been this way."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You're wrong. It wasn't always this bad."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "You really think so?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'believeGhosts',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Do you believe in ghosts?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Do you believe ghosts are real?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Yes."`; } },
                            { textFn: function (c, t) { return `"I do."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "I enjoy a good ghost story."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Even animals can become ghosts. I've seen a ghost dog."`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"No."`; } },
                            { textFn: function (c, t) { return `"Not at all."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'aggro':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Then you haven't killed as many people as I have."`; } }
                                    ];
                                    break;  
                                default:
                                    t.sentiment -= 1;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Really? Everyone has their own ghost story."`; } },
                                        { textFn: function (c, t) { return `${t.name} frowns.<br>${t.name}: "What makes you so confident?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'maybe',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I'm not sure."`; } },
                            { textFn: function (c, t) { return `"I don't know."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Trust me. I know what I've seen."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Oh, believe me, ghosts are real."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "There's a ruined church not far from here. I dare you to spend a night there."`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'believeFate',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Do you believe in fate?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Do you believe in destiny?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Yes."`; } },
                            { textFn: function (c, t) { return `"Definitely."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'disloyal':
                                    t.sentiment -= 2;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You think the world is meant to be like this?."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "You look around, you see the avarice and cruelty, and you think life is supposed to be like this?"`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment += 1;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Everything happens for a reason."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Everything that is, is meant to be."`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Nothing is destined."`; } },
                            { textFn: function (c, t) { return `"No."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                case 'disloyal':
                                    t.sentiment += 2;
                                    convo.talkContinue = true;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Right. Our world cannot be this fucked up by design."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I could never accept that the world is supposed to be like this."`; } }
                                    ];
                                    break;
                                default:
                                    t.sentiment -= 1;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "You think everything just happens?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'maybe',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I'm not sure."`; } },
                            { textFn: function (c, t) { return `"I don't know."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Well, who can blame you if your ignorance is predestined?"`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Then why can fortune tellers predict the future?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'joinUnion',
                req: ['sentiment15', 'healthCritical'],
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "I don't want to die. Let me join you. I can make myself useful."`; } },
                        { textFn: function (c, t) { return `${t.name}: "Let me join you. My strength and wit would serve you well."`; } },
                        { textFn: function (c, t) { return `${t.name}: "You and I see eye to eye. I'll join your party if you allow it."`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Welcome to the union."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Thank you. You won't regret this."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Thank you. You can rely on me."`; } }
                                    ];
                                    break;
                            }
                            let random = Math.floor(Math.random() * resultOptions.length);
                            let message = `${resultOptions[random].textFn(c, t)}`;
                            if (success) {
                                message += `<br>${t.name} joins your union!`;
                                t.team = 'ally';
                                const tIndex = enemy.findIndex(enemy => enemy.uid === t.uid);
                                enemy.splice(tIndex, 1);
                                ally.push(t);
                                t.acted = true;
                                t.ready = false;
                                if (t.knownName !== t.realName) {
                                    const introOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "My name is ${t.realName}."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I'm ${t.realName}."`; } }
                                    ];
                                    random = Math.floor(Math.random() * introOptions.length);
                                    message += `<br>${introOptions[random].textFn(c, t)}`;
                                    t.knownName = t.realName;
                                };
                            }
                            return { message: message};
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"You can't join us."`; } },
                            { textFn: function (c, t) { return `"Not interested."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            switch (t.personality) {
                                default:
                                    t.sentiment -= 20;
                                    resultOptions = [
                                        { textFn: function (c, t) { return `${t.name} looks shocked.<br>${t.name}: "You're a bastard. Fuck you."`; } },
                                        { textFn: function (c, t) { return `${t.name} winces.<br>${t.name}: "Oh god. Are you going to kill me?"`; } }
                                    ];
                                    break;
                            }
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            }
        ]
    },
    malandro: {
        ignoredText: [...genericDialogue.ignoredText],
        initiatePlayer: [...genericDialogue.initiatePlayer],
        initiateTarget: [...genericDialogue.initiateTarget],
        playerTopics: [
            {id: 'askName',
                choiceOptions: [
                    { textFn: function (c, t) { return `"What's your name?"`; } },
                    { textFn: function (c, t) { return `"What is your name?"`; } },
                    { textFn: function (c, t) { return `"What should I call you?"`; } },
                    { textFn: function (c, t) { return `"Who are you? What's your name?"`; } }           
                ],
                resultFn: function (c, t) {
                    t.sentiment += 1;
                    const convo = t.convo;
                    let resultOptions;
                    let message;
                    let message2;
                    
                    const randResult = Math.floor(Math.random() * 10 + 1);
                    if (randResult < t.sentiment) {
                        convo.talkContinue = true;
                        resultOptions = [
                            { textFn: function (c, t) { return `${t.name}: "${t.realName}. You trying to be friends or something?"`; } },
                            { textFn: function (c, t) { return `${t.name}: "${t.realName}. That's me."`; } }
                        ];
                        const randMessage = Math.floor(Math.random() * resultOptions.length);
                        message = `${resultOptions[randMessage].textFn(c, t)}`;
                        t.knownName = t.realName;
                        const message2Options = [
                            { textFn: function (c, t) { return `${c.name} introduces ${c.himself}.`; } }
                        ];
                        const randMessage2 = Math.floor(Math.random() * message2Options.length);
                        message2 = `${message2Options[randMessage2].textFn(c, t)}`;
                        return { message: message, message2: message2};
                    } else {
                        t.sentiment -= 2.5;
                        resultOptions = [
                            { textFn: function (c, t) { return `${t.name}: "Who the hell are you?"`; } },
                            { textFn: function (c, t) { return `${t.name}: "Why do you want to know my name?"`; } }
                        ];
                        const randMessage = Math.floor(Math.random() * resultOptions.length);
                        message = `${resultOptions[randMessage].textFn(c, t)}`;
                        return { message: message };
                    }
                }
            },
            {id: 'baronDepose',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Should the baron lord be overthrown?"`; } },
                    { textFn: function (c, t) { return `"Should the baron lord be deposed?"`; } }
                ],
                resultFn: function (c, t) {
                    let resultOptions;
                    const convo = t.convo;
                    t.sentiment += 1;
                    convo.talkContinue = true;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Whatcha thinking? Cut his head clean off?"`; } },
                        { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "Hell, why not."`; } }
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'whereRatherBe',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Where would you rather be right now?"`; } },
                    { textFn: function (c, t) { return `"What do you wish you were doing right now?"`; } }       
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    t.sentiment += 1;
                    convo.talkContinue = true;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "I'm alright here."`; } },
                        { textFn: function (c, t) { return `${t.name}: "In a different kind of trouble."`; } }
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'howRule',
                choiceOptions: [
                    { textFn: function (c, t) { return `"How should a lord or baron treat their subjects?"`; } },
                    { textFn: function (c, t) { return `"How should a lord or baron rule their subjects?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    t.sentiment -= 2;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "I don't know. You always talk about this politics shit?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "I don't care. Nobody rules over me."`; } }
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'worthDying',
                choiceOptions: [
                    { textFn: function (c, t) { return `"What is worth dying for?"`; } },
                    { textFn: function (c, t) { return `"What's worth dying for?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    t.sentiment -= 1;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Money. Sex. Pride. People die for anything."`; } },
                        { textFn: function (c, t) { return `${t.name}: "Who cares? When your time is up, you're gone."`; } }
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'believeAstrology',
                choiceOptions: [
                    { textFn: function (c, t) { return `"Do you believe in astrology?"`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    convo.talkContinue = true;
                    t.sentiment += 1;
                    let resultOptions;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Word of advice. Never cheat on a fortune teller."`; } },
                        { textFn: function (c, t) { return `${t.name}: "Look, I don't get it, but it works."`; } }
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    const message = `${resultOptions[random].textFn(c, t)}`;
                    return { message: message};
                }
            },
            {id: 'joinUnion',
                req: ['sentiment15'],
                choiceOptions: [
                    { textFn: function (c, t) { return `"You should join us."`; } },
                    { textFn: function (c, t) { return `"You should join our union."`; } }
                ],
                resultFn: function (c, t) {
                    const convo = t.convo;
                    let resultOptions;
                    let success = true;
                    resultOptions = [
                        { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "Fuck it, why not?"`; } },
                        { textFn: function (c, t) { return `${t.name} thinks for a moment.<br>${t.name}: "Screw it. You seem alright. I'm coming."`; } },
                    ];  
                    let random = Math.floor(Math.random() * resultOptions.length);
                    let message = `${resultOptions[random].textFn(c, t)}`;
                    let message2;
                    if (success) {
                        message += `<br>${t.name} joins your union!`;
                        t.team = 'ally';
                        const tIndex = enemy.findIndex(enemy => enemy.uid === t.uid);
                        enemy.splice(tIndex, 1);
                        ally.push(t);
                        t.acted = true;
                        t.ready = false;
                        if (t.knownName !== t.realName) {
                            const introOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Call me ${t.realName}."`; } },
                                { textFn: function (c, t) { return `${t.name}: "The name is ${t.realName}."`; } },
                            ];
                            random = Math.floor(Math.random() * introOptions.length);
                            message2 = `${introOptions[random].textFn(c, t)}`;
                            t.knownName = t.realName;
                        };
                    }
                    return { message: message, message2: message2 };
                }
            }
        ],
        targetTopics: [
            {id: 'penOrSword',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Which is stronger, the pen or the blade?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Which is mightier, the pen or the blade?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'blade',
                        choiceOptions: [ { textFn: function (c, t) { return `"The blade."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment += 0.5;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "That's right."`; } }
                            ];
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'pen',
                        choiceOptions: [ { textFn: function (c, t) { return `"The pen."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "I don't know how to read, and I turned out alright."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Bullshit. You just think that sounds smart."`; } }
                            ];
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'equal',
                        choiceOptions: [ { textFn: function (c, t) { return `"Both are equal."`; } } ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Come on, that's a cop-out."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I hate people who don't know how to answer a question."`; } }
                            ];
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'doYouGamble',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Are you a gambler?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "You like to gamble?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"From time to time."`; } },
                            { textFn: function (c, t) { return `"I've been known to dabble."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment += 1;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Unfortunately for you, I always win."`; } },
                                { textFn: function (c, t) { return `${t.name}: "It doesn't matter what I lose. I'll win it back later."`; } }
                            ];
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Not my thing."`; } },
                            { textFn: function (c, t) { return `"Not interested."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "I'm losing interest."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Boring."`; } }
                            ];
                            console.log(`resultOptions below:`);
                            console.log(resultOptions);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'whyHated',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "I think I've heard about you. The baron wants you dead, but why?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Are you the ${c.man} the baron put a bounty on? Your corpse is worth some money."`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'vocal',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I speak against tyrants, and he is one."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "That's cute."`; } },
                                { textFn: function (c, t) { return `${t.name}: "You're just that annoying, ay?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'scared',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"He's afraid of me."`; } },
                            { textFn: function (c, t) { return `"He fears me."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            convo.talkContinue = true;
                            t.sentiment += 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} grins.<br>${t.name}: "Big words from a small ${c.man}."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Huh. Keep talking."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'dontKnow',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I don't know why."`; } },
                            { textFn: function (c, t) { return `"I have no idea why."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            convo.talkContinue = true;
                            t.sentiment += 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} smiles.<br>${t.name}: "Drank too much and woke up with a price on your head?"`; } },
                                { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "Damn. You're screwed."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'drumsOfWar',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "From what I hear, all the baron lords are preparing for war. You know anything?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Something big is about to happen."`; } },
                            { textFn: function (c, t) { return `"I've heard the same."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "There's money to be made in times like this."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Nothing has changed."`; } },
                            { textFn: function (c, t) { return `"I don't know."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "You need to open your ears."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Useless, you are."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'believeGhosts',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "You believe in ghosts?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "You think ghosts are real?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Yes."`; } },
                            { textFn: function (c, t) { return `"I do."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment += 1;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Being a ghost would be fun. Just watching people, giving 'em a scare."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"No."`; } },
                            { textFn: function (c, t) { return `"Not at all."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Don't knock superstitions. Some of them can bite your ass."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Then promise you won't haunt me if I kill you."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'maybe',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I'm not sure."`; } },
                            { textFn: function (c, t) { return `"I don't know."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "It was a yes or no question."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'believeFate',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "You believe in fate?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Hey, do you believe in destiny?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Yes."`; } },
                            { textFn: function (c, t) { return `"Definitely."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Nothing is given. Everything I have, that was me."`; } },
                                { textFn: function (c, t) { return `${t.name}: "You think you're a slave to fate?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Nothing is destined."`; } },
                            { textFn: function (c, t) { return `"No."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment += 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "That's right. We have to make it ourself."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'maybe',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I'm not sure."`; } },
                            { textFn: function (c, t) { return `"I don't know."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Surely you've thought about it before?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "C'mon. You can be honest with me."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'joinUnion',
                req: ['sentiment15', 'healthCritical'],
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "We could go far together. Let me join you."`; } },
                        { textFn: function (c, t) { return `${t.name}: "Look, I'm a smart guy. You could use my help. Let me join your party."`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Welcome to the union."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Good decision, friend."`; } },
                                { textFn: function (c, t) { return `${t.name}: "Let's kick some ass!"`; } }
                            ];
                            let random = Math.floor(Math.random() * resultOptions.length);
                            let message = `${resultOptions[random].textFn(c, t)}`;
                            let message2;
                            if (success) {
                                message += `<br>${t.name} joins your union!`;
                                t.team = 'ally';
                                const tIndex = enemy.findIndex(enemy => enemy.uid === t.uid);
                                enemy.splice(tIndex, 1);
                                ally.push(t);
                                t.acted = true;
                                t.ready = false;
                                if (t.knownName !== t.realName) {
                                    const introOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Oi, call me ${t.realName}."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Oi, my name's ${t.realName}."`; } }
                                    ];
                                    random = Math.floor(Math.random() * introOptions.length);
                                    message2 = `<br>${introOptions[random].textFn(c, t)}`;
                                    t.knownName = t.realName;
                                };
                            }
                            return { message: message, message2: message2};
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"You can't join us."`; } },
                            { textFn: function (c, t) { return `"Not interested."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 20;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} laughs.<br>${t.name}: "You're gonna do me like that? Fuck you."`; } },
                                { textFn: function (c, t) { return `${t.name} looks shocked.<br>${t.name}: "What was I thinking? You're an idiot."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'handsome',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Oi, do you think I'm handsome?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "Think I'm good looking?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"You're hot."`; } },
                            { textFn: function (c, t) { return `"Yes."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment += 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name} winks.<br>${t.name}: "You like it, huh?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "I see you looking at me."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Nah."`; } },
                            { textFn: function (c, t) { return `"Not my type."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Hey, that hurts!"`; } },
                                { textFn: function (c, t) { return `${t.name}: "That stings!"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'maybe',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"You're alright."`; } },
                            { textFn: function (c, t) { return `"You're not bad looking."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Damn. That's it?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "Really!? I'm just average?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'whatAnimal',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "What animal do I remind you of?"`; } },
                        { textFn: function (c, t) { return `${t.name}: "What kind of animal would I be?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'horse',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"A horse."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            t.convo.talkContinue = true;
                            t.sentiment += 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Big, strong, but a gentle ride."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'dog',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"A dog."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "What about me reminds you of a pup?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "I'm not that desperate to be loved."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'goat',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"A goat."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 1;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "You see me eating cud?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'lion',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"A lion."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Trying to flatter me?"`; } },
                                { textFn: function (c, t) { return `${t.name}: "Are you flirting with me?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'surrender',
                req: ['sentiment10', 'healthCritical'],
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Please, let me go."`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'yes',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Go."`; } },
                            { textFn: function (c, t) { return `"Run."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Thank you."`; } },
                                { textFn: function (c, t) { return `${t.name}: "I won't forget this favour."`; } }
                            ];
                            const charbox = t.statbox.div;
                            statEnemy.removeChild(charbox);
                            const tIndex = enemy.findIndex(char => char.uid === t.uid);
                            enemy.splice(tIndex, 1);
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"No."`; } },
                            { textFn: function (c, t) { return `"Not happening."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            t.sentiment -= 5;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "You're a sick fuck."`; } },
                                { textFn: function (c, t) { return `${t.name}: "What's wrong with you?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'join',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Join us or die."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            const convo = t.convo;
                            const randResult = Math.floor(Math.random() * 15 + 1);

                            if (randResult < t.sentiment) {
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "Alright, I'll join you."`; } }
                                ];
                                const random = Math.floor(Math.random() * resultOptions.length);
                                let message = resultOptions[random].textFn(c, t);
                                message += `<br>${t.name} joins your union!`;
                                t.team = 'ally';
                                const tIndex = enemy.findIndex(enemy => enemy.uid === t.uid);
                                enemy.splice(tIndex, 1);
                                ally.push(t);
                                t.acted = true;
                                t.ready = false;
                                let message2;
                                if (t.knownName !== t.realName) {
                                    const introOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Oi, call me ${t.realName}."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Oi, my name's ${t.realName}."`; } }
                                    ];
                                    const randMessage2 = Math.floor(Math.random() * introOptions.length);
                                    message2 = `${introOptions[randMessage2].textFn(c, t)}`;
                                    t.knownName = t.realName;
                                };
                                return { message: message, message2: message2};  
                            } else {
                                t.sentiment -= 1;
                                resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "If you won't let me go, I can't trust you."`; } }
                                ];
                                const random = Math.floor(Math.random() * resultOptions.length);
                                return { message: resultOptions[random].textFn(c, t) };
                            }
                        }
                    }
                ]
            },
            {id: 'lover',
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "What do you look for in a lover?"`; } }
                    ];
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
                answerOptions: [
                    {id: 'looks',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Good looks."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            t.convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "At least you're honest."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'loyalty',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Loyalty"`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            t.convo.talkContinue = true;
                            t.sentiment += 1; 
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Not everyone is as loyal as me."`; } },
                                { textFn: function (c, t) { return `${t.name}: "It's hard to come by."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'personality',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"Personality."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            t.convo.talkContinue = true;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "A romantic, ay?"`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    },
                    {id: 'no',
                        choiceOptions: [
                            { textFn: function (c, t) { return `"I'm not interested."`; } }
                        ],
                        resultFn: function (c, t) {
                            let resultOptions;
                            t.sentiment -= 2;
                            resultOptions = [
                                { textFn: function (c, t) { return `${t.name}: "Makes sense. Just look how you're dressed."`; } }
                            ];
                            const random = Math.floor(Math.random() * resultOptions.length);
                            return { message: resultOptions[random].textFn(c, t) };
                        }
                    }
                ]
            },
            {id: 'giveItem',
                req: ['sentiment5'],
                startFn: function (c,t ) {
                    let resultOptions = [
                        { textFn: function (c, t) { return `${t.name}: "Give me something and I'll leave you alone."`; } }
                    ];
                    this.answerOptions = [
                        {id: 'no',
                            index: 0,
                            choiceOptions: [
                                { textFn: function (c, t) { return `"Not happening."`; } },
                                { textFn: function (c, t) { return `"No."`; } }
                            ],
                            resultFn: function (c, t) {
                                t.sentiment -= 1;
                                const resultOptions = [
                                    { textFn: function (c, t) { return `${t.name}: "Well, fuck you then."`; } }
                                ];
                                const random = Math.floor(Math.random() * resultOptions.length);
                                return { message: resultOptions[random].textFn(c, t) };

                            }
                        },
                        {id: 'nothing',
                            index: 1,
                            choiceOptions: [
                                { textFn: function (c, t) { return `"I don't have anything to give."`; } }
                            ],
                            resultFn: function (c, t) {
                                if (c.items.length > 0) {
                                    const coinFlip = Math.floor(Math.random() * 2);
                                    if (coinFlip === 0) {
                                        t.sentiment -= 1;
                                        const resultOptions = [
                                            { textFn: function (c, t) { return `${t.name}: "Seriously? Pathetic."`; } },
                                            { textFn: function (c, t) { return `${t.name}: "Are you embarassed?"`; } }
                                        ];
                                        const random = Math.floor(Math.random() * resultOptions.length);
                                        return { message: resultOptions[random].textFn(c, t) };
                                    } else if (coinFlip === 1) {
                                        t.sentiment -= 5;
                                        const resultOptions = [
                                            { textFn: function (c, t) { return `${t.name}: "I can see your ${c.items[0].name}."`; } },
                                            { textFn: function (c, t) { return `${t.name}: "Don't lie to me."`; } }
                                        ];
                                        const random = Math.floor(Math.random() * resultOptions.length);
                                        return { message: resultOptions[random].textFn(c, t) };
                                    }
                                } else {
                                    t.sentiment -= 1;
                                    const resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Seriously? Pathetic."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Are you embarassed?"`; } }
                                    ];
                                    const random = Math.floor(Math.random() * resultOptions.length);
                                    return { message: resultOptions[random].textFn(c, t) };
                                }
                            }
                        }
                    ];
                    let index = 2;
                    c.items.forEach(item => {
                        const itemOption = {
                            id: `${item.uid}`,
                            index: index,
                            choiceOptions: [
                                { textFn: function (c, t) { return `"Have my ${item.name}"`; } },
                                { textFn: function (c, t) { return `"Take my ${item.name}"`; } },
                                { textFn: function (c, t) { return `"Here's my ${item.name}"`; } },
                                { textFn: function (c, t) { return `"I'll give you my ${item.name}"`; } },
                                { textFn: function (c, t) { return `"You can have my ${item.name}"`; } },
                            ],
                            resultFn: function (c, t) {
                                const itemIndex = c.itemUidList.findIndex(uid => uid === item.uid);
                                c.itemUidList.splice(itemIndex, 1);
                                t.itemUidList.push(item.uid);
                                const randResult = Math.floor(Math.random() * 20);
                                if (randResult < t.sentiment) {
                                    const resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Alright. I'm a man of my word. See ya!"`; } },
                                        { textFn: function (c, t) { return `${t.name}: "I'm satisfied. I'll see you around."`; } }
                                    ];
                                    const tIndex = enemy.findIndex(char => char.uid === t.uid);
                                    enemy.splice(tIndex, 1);
                                    const random = Math.floor(Math.random() * resultOptions.length);
                                    return { message: resultOptions[random].textFn(c, t) };
                                } else {
                                    t.convo.talkContinue = true;
                                    t.sentiment += 3;
                                    const resultOptions = [
                                        { textFn: function (c, t) { return `${t.name}: "Sorry. I changed my mind."`; } },
                                        { textFn: function (c, t) { return `${t.name}: "Hm... Actually, that's not enough."`; } }
                                    ];
                                    const random = Math.floor(Math.random() * resultOptions.length);
                                    return { message: resultOptions[random].textFn(c, t) };
                                }
                            }
                        };
                        index += 1;
                        this.answerOptions.push(itemOption);
                    });
                    const random = Math.floor(Math.random() * resultOptions.length);
                    return resultOptions[random].textFn(c, t);
                },
            }
        ]
    }
}

function initiateConversation (c, t) {
        //go to results scene
        countMessage = 0;
        menuBattle.innerHTML = '';
        statusContainer.innerHTML = '';
        statusContents = '';
        resultContainer.innerHTML = '';
        resultContents = '';
        dialogueContents = '';
        t.sentiment += 1.5;
        t.convo.talkContinue = false;
        t.convo.talkStop = false;
        resultContainer.style.position = 'absolute';
        resultContainer.style.top = `20px`;
        dialogue(c, t);
        updateStatbox();
}

async function initiateResults (c, action) {
    //go to results scene
    countMessage = 0;
    menuBattle.innerHTML = '';
    if (c.team === 'ally') {
        createMessage('reset');
        updateStatus();
        updateStatbox();
    }
    //statusContainer.style.display = 'block';
    //statusContainer.style.minHeight = '45px';

    resultContainer.innerHTML = '';
    if (action.textAction) {
        await printWithDelay([`<div id="announce-action"><strong>${action.textAction(c)}</strong></div>`], 700, resultContainer);
    }
    else {
        await printWithDelay([`<div id="announce-action"><strong>${c.name} uses ${action.name}.</strong></div>`], 700, resultContainer);
    }
    await executeAction(c, action);
    if (action.thingType === 'item') {
        c.takeItem(action, 'consume');
    }
    await printWithDelay([...messages.con], 700, resultContainer);
    await delay(375);
    updateStatus();
    await printWithDelay([messages.continue], 700, resultContainer);
}

async function executeAction (c, action) {
    for (let actIndex = 0; actIndex < action.action.length; ++actIndex) {
        const act = action.action[actIndex];

        const stopAction = combatHistory.find(log => log.round === round && log.turn === turn && log.cUid === c.uid && log.aId === action.id && log.context.stopAction);
        if (stopAction) {
            console.log('stopAction log found!');
            return;
        }

        if (actIndex > 0) {
            autoTarget(c, act, actIndex);
        }
        if (act.targetList.length === 0) {
            console.log(`no valid targets for ${c.name} ${action.name} actIndex ${actIndex}!`);
            continue;
        }
        if (act.textAct) {
            const textAct = act.textAct(c);
            if (textAct) {
                await printWithDelay([`<div class="result-message">${textAct}</div>`], 700, resultContainer);
            }
        }

        //process act on each target in targetList
        for (targetIndex = 0; targetIndex < act.targetList.length; ++targetIndex) {
            const t = act.targetList[targetIndex];
            console.groupCollapsed(`${c.name} processing targets for ${action.name} actIndex ${actIndex} targetIndex ${targetIndex} target ${t.name}`);
            if ((actIndex === 0 && !action.selectDead && !action.selectDeadOnly && t.dead) ||
            (actIndex > 0 && !act.targetDead && !act.targetDeadOnly && t.dead)) {
                console.log('this character is already dead and therefore invalid, so skip this target');
                console.groupEnd();
                continue;
            }
            if (act.textTarget) {
                await printWithDelay([`<div class="result-message">${act.textTarget(c, t)}</div>`], 700, resultContainer);
            }
            await actionFn[act.actFn](c, action, act, actIndex, t, targetIndex);
            //prints messages for act.textSuccess, act.textFail, act.textMiss into the resultGroup
            checkEffExpire('target');
            console.groupEnd();
            updateStatbox();
        }
        checkEffExpire('act');
    }
}

function createMessage (type, message, obj) {
    switch (type) {
        case 'status':
            messages.status.push(`<div class="status-message">${message}</div>`);
            break;
        case 'con':
            messages.con.push(`<div class="status-message">${message}</div>`);
            break;
        case 'priority':
            messages.priority.push(`<div class="status-message">${message}</div>`);
            break;
        case 'weather':
            messages.weather = message;
            break;
        case 'celestial':
            messages.celestial = message;
            break;
        case 'announceAction':
            messages.announce = `<div id="announce-action"><strong>${message}</strong></div>`;
            break;
        case 'result':
            messages.result.push(`<div class="result-message">${message}</div>`);
            break;
        case 'dialogue':
            messages.result.push(`<div class="result-message">${message}</div>`);
            messages.dialogue.push(`<div class="result-message">${message}</div>`);
            break;
        case 'talkContinue':
            messages.result = [messages.dialogue.join('')];
            messages.choice = [];
            break;
        case 'choice':
            messages.choice.push(`<div class="choice-message"><button id="choice${obj.index}">${obj.choiceText}</button></div>`);
            break;
        case 'char':
            const charObj = messages.char.find(char => char.uid === obj.uid);
            if (charObj) {
                charObj.segArray.push(message);
            } else {
                messages.char.push({uid: obj.uid, team: obj.team, segArray: [message]});
            }
            break;
        case 'reset':
            messages = {
                priority: [],
                status: [],
                weather: '',
                celestial: '',
                char: [],
                con: [],
                announce: '',
                result: [],
                dialogue: [],
                choice: [],
                continue: `<div id="continue-button"><button onclick="combatTurnEnd()"><u>Continue</u></button></div>`
            };
            statusContainer.style.display = '';
            break;
        default:
            throw new Error(`INVALID createMessage ${type}, ${message}`);
    }
}

const actionFn = {
    attack: async function (c, action, act, actIndex, t, targetIndex) {
        console.log(`executing attack action c ${c.name} t ${t.name} action ${action.name} actIndex ${actIndex}`);
        //success variables
        let accuracy; //percentage chance of success, succeed if accuracyRoll is less than this value
        let accuracyRoll; //random value between 1-100
        let damage; //how much damage will the attack deal?
        let damageDealt; //how much damage is actually dealt (based on Hp actually lost)
        let damageMultiplier; //multiplied by damage
        let [success, critical, weak, resist, immune, kill] = [false, false, false, false, false, false];

        //check element, categories
        let category = act.category;
        let element = act.element;
        console.log('act.category below:');
        console.log(act.category);
        console.log(`element: ${element}`);
        if (action.category.includes('weaponSkill') || category.includes('weaponSkill')) {
            category.push('weapon');
        }
        if (c.weapon.category.includes('unarmed') && (action.category.includes('unarmed') || category.includes('unarmed'))) {
            category.push('weapon');
        }
        if ((action.category.includes('weapon') || category.includes('weapon') || category.includes('weaponSkill')) && c.checkWeaponElement) {
            element = c.checkWeaponElement;
            category = category.filter(cat => !elements.includes(cat));
            category.push(element);
            console.log(`attack element is modified by mod eff or currentEff to ${element}`);
        }

        //check element attack/targeted triggers
        c.checkTriggers('attack', category);
        t.checkTriggers('attackT', category);

        // determine accuraccy, success
        accuracy = (act.accuracy ?? 100); //start with act base accuracy, default to 100
        accuracy += c.accuracy; //add c accuracy bonus
        accuracy -= t.dodge; //subtract t dodge bonus
        console.log(`base accuracy is ${accuracy}: ${act.accuracy} + c.accuracy ${c.accuracy} - t.dodge ${t.dodge}`);
        let accuracyMultiplier = c.accuracyM - t.dodgeM + 1; //compare acc and dodge multiplier stats
        if (accuracyMultiplier >= 1) {
            accuracy = accuracy * accuracyMultiplier;
            console.log(`accuracy is ${accuracy} after multiplying ${accuracyMultiplier}`);
            console.log(`accuracyMultiplier ${accuracyMultiplier} = c.accuracyM ${c.accuracyM} - t.dodgeM ${t.dodgeM} + 1`);
        } else {
            accuracy = accuracy * (c.accuracyM / t.dodgeM);
            console.log(`accuracy is ${accuracy} after * (c.accuracyM ${c.accuracyM} / t.dodgeM ${t.dodgeM})`);
        }
        if (act.statAcc) {
            let accFactor = c[act.statAcc] / t[act.statDodge];
            console.log(`accFactor ${accFactor}: char ${c.name} ${act.statAcc} ${c[act.statAcc]} target ${t.name} ${act.statDodge} ${t[act.statDodge]}`);
            let lessThan = false;
            if (accFactor < 1) {
                lessThan = true;
                accFactor = 1 / accFactor;
                console.log(`accFactor is less than 1, so invert!`);
            }
            //range 1 to 1.05 is unchanged
            if (accFactor > 1.05 && accFactor <= 1.25) {
                accFactor = 1.05 + ((accFactor - 1.05) * 0.25); //range 1.05 to 1.1
            } else if (accFactor > 1.25 && accFactor <= 2) {
                accFactor = 1.1 + ((accFactor - 1.25) * 0.2); //range 1.1 to 1.25
            } else if (accFactor > 2) {
                accFactor = Math.min(1.33, 1.25 + ((accFactor - 2) * 0.08)); //range 1.25 to 1.33
            }
            console.log(`previous accuracy is ${accuracy}, after scaling accFactor is now ${accFactor}`);
            if (lessThan) {
                accFactor = 2 - accFactor;
                console.log(`after inverting, accFactor is ${accFactor}`);
            }
            accuracy = accuracy * accFactor;
            console.log(`accuracy is ${accuracy} after multiplying ${accFactor}`);
        }
        accuracyRoll = Math.floor(Math.random() * 100 + 1);
        console.log(`accuracy goal is ${accuracy}, accuracyRoll is ${accuracyRoll}`);
        if (accuracyRoll <= accuracy) {
            console.log('Attack is successful!');
            success = true;
            t.remember('attackedMe', c, {action: action, element: element});
            c.checkTriggers('attackSuccess', category);
            t.checkTriggers('attackSuccessT', category);

            damageMultiplier = c.damageM; //damageMultiplier, c.damageM
            let critChance = Math.max(0, (act.critChance ?? 5) + c.critChance); //critChance
            console.log(`critChance is ${critChance} from act.critChance ${act.critChance ?? 5} + c.critChance ${c.critChance}`);
            critChance = critChance * c.critChanceM; //critChanceM
            console.log(`critChance is ${critChance} after multiplying c.critChanceM`);
            if (accuracyRoll <= critChance) {
                console.log('Critical hit!');
                critical = true;
                let critMultiplier = (act.critMultiplier ?? 1.5) + c.critMultiplier; //critMultiplier
                critMultiplier = critMultiplier * c.critMultiplierM; //c.critMultiplierM
                damageMultiplier = damageMultiplier * critMultiplier; //apply to damageModifier
            }
            if (t.element.weak.includes(element)) {
                console.log(`target ${t.name} is weak to ${element} attack ${action.name}, damageMultiplier += 0.5!`);
                weak = true;
                damageMultiplier += 0.5;
                c.remember('weak', t, {element: element});
            } else if (t.element.resist.includes(element)) {
                console.log(`target ${t.name} resists ${element} attack ${action.name}, damageMultiplier = Math.max(damageMultiplier / 2, damageMultiplier - 0.5)!`);
                resist = true;
                damageMultiplier = Math.max(damageMultiplier / 2, damageMultiplier - 0.5);
                c.remember('resist', t, {element: element});
            } else if (t.element.immune.includes(element)) {
                console.log(`target ${t.name} is immune to ${element} attack ${action.name}, damageMultiplier = 0!`);
                immune = true;
                damageMultiplier = 0;
                c.remember('immune', t, {element: element});
            } else {
                console.log(`target ${t.name} is neutral to ${element} attack ${action.name}!`);
                c.remember('neutral', t, {element: element});
            }
            damage = (act.damage ?? 0) + c.damage; //damage, act.damage, c.damage
            console.log(`damage is ${damage} after adding act.damage ${act.damage} and c.damage ${c.damage}`);
            if (act.damageP) {
                const damageP = c[act.statDam] * (act.damageP / 100); //act.statDam, act.damageP
                damage = damage + damageP;
                console.log(`damage is ${damage} after adding ${damageP}: c[${act.statDam}] ${c[act.statDam]} act.damageP ${act.damageP}`);
            }
            if (act.statDef) {
                const defenceP = c[act.statDam] / t[act.statDef];
                if (defenceP < 1) {
                    damage = damage * defenceP;
                    console.log(`damage is reduced to ${damage} after considering defenceP ${defenceP}: c[${act.statDam}] ${c[act.statDam]}, t[${act.statDef}] ${t[act.statDef]}`);    
                } else if (defenceP > 1) {
                    console.log(`attacker's c[${act.statDam}] ${c[act.statDam]} is greater than defender's t[${act.statDef}] ${t[act.statDef]}, so ignore ${defenceP}`);     
                }
            }
            damage = Math.floor((damage * damageMultiplier) + 0.5); //apply damageMultiplier
            console.log(`damage is ${damage} after factoring damageMultiplier ${damageMultiplier}`);
            if (t.defenceM > 1) { //t.defenceM
                damage = Math.floor((damage / t.defenceM) + 0.5);
                console.log(`t.defenceM ${t.defenceM} reduces damage ${damage}`);
            }
            else if (t.defenceM < 1) { //t.defenceM
                damage = Math.floor(damage * (((t.defenceM - 1) * -1) + 1));
                console.log(`t.defenceM ${t.defenceM} increases damage: ${damage}`);
            }
            const randomFactor = (Math.random() * 0.3) + 0.85;
            damage = Math.floor(damage * randomFactor + 0.5);
            console.log(`damage is ${damage} after applying randomFactor ${randomFactor}`);
            const prevHp = t.currentHp;
            t.adjustHp('damage', damage);
            damageDealt = prevHp - t.currentHp;
            if (t.currentHp <= 0) {
                kill = true;
            }
            else {
                let conDamage = act.conDamage;
                if (critical) { conDamage += 0.75; }
                if (weak) { conDamage += 1; }
                if (conDamage > 0 && !t.element.resist.includes(element) && !t.element.immune.includes(element)) {
                    t.adjustCon(element, 'damage', conDamage);
                }
            }
        }
        let resultText = '';
        //print results
        if (success) {
            resultText += `${act.textSuccess(c,t)}`;
            if (damageDealt) {
                resultText += `<br>${damageDealt} ${replaceElement(element, true)} damage.`;
            } else if (damageDealt === 0) {
                resultText += `<br><u>No effect!</u>`;
            }
            if (damageDealt) {
                if (critical) { resultText += `<div class="emphasis">Critical hit!</div>`; }
                if (weak) { resultText += `<div class="emphasis">Super effective!</div>`; }
                else if (resist) { resultText += `<div class="emphasis">Resisted!</div>`; }
            } else if (immune) { resultText += `<div class="emphasis">Immune!</div>`; }
        } else {
            if (act.textMiss) {
                resultText += act.textMiss(c,t);
            } else {
                resultText += `${t.name} dodged the attack.`;
            }
            if (act.stopAction === 'miss') {
                new CombatLog({cUid: c.uid, tUid: t.uid, targetIndex: targetIndex, aUid: action.uid, aId: action.id, actIndex: actIndex, stopAction: true});
            }
        }
        await printWithDelay([`<div class="result-message">${resultText}</div>`], 1000, resultContainer);
        if (kill) {
            await printWithDelay([`<div class="emphasis-straight">${t.name} is killed!</div>`], 800, resultContainer);
        }

        //record results in combatHistory as a CombatLog
        const context = {cUid: c.uid, tUid: t.uid, targetIndex: targetIndex, aUid: action.uid, aId: action.id, actIndex: actIndex};
        Object.assign(context, {attack: true, success: success, element: element});
        if (success) {
            Object.assign(context, { critical: critical, weak: weak, resist: resist, immune: immune, damageDealt: damageDealt, kill: kill });
        }
        new CombatLog (context);
    },
    modify: async function (c, action, act, actIndex, t, targetIndex) {
        const actMod = act.modifier;
        let relevantMods = [];

        //shortcut if modifiers already created this round, and actMod .shared/.global
        console.log('current combatHistory:');
        console.log(combatHistory);
        const modLog = combatHistory.find (log =>
            log.round === round &&
            log.turn === turn &&
            log.actIndex === actIndex &&
            log.aId === action.id &&
            log.context.modify &&
            log.context.success);
        if (modLog && (actMod.shared || actMod.global)) {
            console.log('modLog found and actMod shared/global, initiating shareModifier');
            const sharedMod = modifiers.find(mod => mod.uid === modLog.context.mUid);
            if (!sharedMod) { throw new Error ('modLog found, shareModifier initiated, but no sharedMod found'); }
            if (actMod.shared) {
                sharedMod.give(t);
                if (act.textSuccess) {
                    await printWithDelay([`<div class="result-message">${act.textSuccess(c,t)}</div>`], 700, resultContainer);
                }
                let context = {cUid: c.uid, tUid: t.uid, targetIndex: targetIndex, aUid: action.uid, aId: action.id, actIndex: actIndex};
                Object.assign(context, {modify: true, success: true, mUid: sharedMod.uid});
                new CombatLog (context);
            } else if (actMod.global) {
                let context = {cUid: c.uid, tUid: t.uid, targetIndex: targetIndex, aUid: action.uid, aId: action.id, actIndex: actIndex};
                Object.assign(context, {modify: true, success: true, mUid: sharedMod.uid});
                new CombatLog (context);
            }
            return;
        }

        //check onePer rules
        if (actMod.onePerC || actMod.onePerId) {
            if (!actMod.id) { //use actIndex to differentiate modifiers from the same source
                relevantMods = modifiers.filter(mod => mod.id === action.id && mod.actIndex === actIndex);
            } else if (actMod.id) { //if specialId is given, check for that instead
                relevantMods = modifiers.filter(mod => mod.specialId === actMod.id);
            }
            if (relevantMods.length > 0) {
                let teamUids = targetTeam(t, 'ally').map(char => char.uid);
                switch (actMod.onePerC) {
                    case 'target':
                        relevantMods = relevantMods.filter(mod => mod.targetUidList.includes(t.uid) && mod.cUid === c.uid);
                        break;
                    case 'global':
                        relevantMods = relevantMods.filter(mod => mod.cUid === c.uid);
                        break;
                    case 'team':
                        relevantMods = relevantMods.filter(mod => mod.cUid === c.uid
                            && mod.targetUidList.some(tUid => teamUids.includes(tUid)));
                        break;
                }
                switch (actMod.onePerId) {
                    case 'target':
                        relevantMods = relevantMods.filter(mod => mod.targetUidList.includes(t.uid));
                        break;
                    case 'global':
                        break;
                    case 'team':
                        relevantMods = relevantMods.filter(mod => mod.targetUidList.some(tUid => teamUids.includes(tUid)));
                        break;
                }
            }
        }
        console.log(`found ${relevantMods.length} relevantMods`);
        if (relevantMods.length > 0) {
            console.log(`checking remodify`);
            switch (actMod.remodify) {
                case 'replace':
                    relevantMods.forEach(existingMod => {
                        existingMod.remove(); 
                    });
                    break;
                //add support for refresh
            }
        }
        //add support for reTarget

        //create new Modifier
        const m = new Modifier(actMod, t, c, action, actIndex);
        console.log(`Created new modifier ${m.id} with target ${t.name}`);
        if (act.textSuccess) {
            await printWithDelay([`<div class="result-message">${act.textSuccess(c,t)}</div>`], 700, resultContainer);
        }
        let context = {cUid: c.uid, tUid: t.uid, targetIndex: targetIndex, aUid: action.uid, aId: action.id, actIndex: actIndex};
        Object.assign(context, {modify: true, success: true, mUid: m.uid});
        new CombatLog (context);
        console.log('modifier created done!');
        console.log('see modifiers array below');
        console.log(modifiers);
    },
    heal: async function (c, action, act, actIndex, t, targetIndex) {
        c.checkTriggers('heal', []);
        t.checkTriggers('healT', []);
        let heal = act.heal ?? 0; //act.heal
        if (act.statHeal && act.healP) {
            heal += c[act.statHeal] * (act.healP / 100); //act.statHeal, act.healP
        }
        heal = heal * c.healTargetM * t.healSelfM; //c.healTargetM, t.healSelfM
        if (act.healMaxHp) {
            heal += t.maxHp * (act.healMaxHp / 100); //act.healMaxHp
        }
        heal = Math.floor(heal + 0.5);
        const prevHp = t.currentHp;
        t.adjustHp('heal', heal);
        const healDealt = t.currentHp - prevHp;
        if (act.conHeal && !act.conHealElement) {
            elements.forEach(element => {
                t.adjustCon(element, 'heal', act.conHeal); //act.conHeal
            });
        } else if (act.conHeal && act.conHealElement) {
            t.adjustCon(act.conHealElement, 'heal', act.conHeal); //act.conHeal, act.conHealElement
        }
        if (healDealt > 0) {
            await printWithDelay([`<div class="result-message">${act.textSuccess(c,t)} (healed ${healDealt})</div>`], 700, resultContainer);
        } else {
            await printWithDelay([`${t.name} is already healthy.`], 700, resultContainer);
        }
    }
};

//ADD SUPPORT FOR INCLUDING DEAD TARGETS
function autoTarget (c, act, actIndex) {
    console.groupCollapsed(`${c.name} ${actIndex} autoTarget`);
    act.targetList = [];
    let targetList = []; //char objs for final list of targets inserted into act.targetList
    let relevantLogs; //filtered logs
    let prevUids; //array of tUids of targs of prev act
    let team; //array of enemy or ally team char objs
    let everyone; //array of everyone
    let targetIndex; //index of char selected randomly

    function findCharacters (targetList, targetUids) {
        targetUids.forEach (tUid => {
            const target = combat().find(char => char.uid === tUid);
            targetList.push(target);
        });
    }
    function filterDead (targetList) {
        if (!act.targetDead && !act.targetDeadOnly) { return targetList.filter(char => !char.dead); }
        else if (act.targetDead) { return targetList; }
        else if (act.targetDeadOnly) { return targetList.filter(char => char.dead); }
    }
    function filterPrev (targetList) {
        console.log(`targetList at start of checking filterPrev is:`);
        console.log(deepClone(targetList));
        let logs = []; //filtered logs
        if (act.targetNotPrev) { //remove chars targeted by last act (regardless of success) if act.targetNotPrev
            logs = combatHistory.filter(log => log.round === round && log.turn === turn && log.actIndex === (actIndex - 1));  
        } else if (act.targetNotPrevSuccess) { //remove chars successfully targeted by last act if act.targetNotPrevSuccess
            logs = combatHistory.filter(log => log.round === round && log.turn === turn && log.actIndex === (actIndex - 1) && log.context.success === true);
        } else if (act.targetNotPrec) { //remove chars that have been targeted by any preceding acts (regardless of success) if act.targetNotPrec
            logs = combatHistory.filter(log => log.round === round && log.turn === turn);
        } else if (act.targetNotPrecSuccess) { //remove chars that have been successfully targeted by any preceding acts if act.targetNotPrecSuccess
            logs = combatHistory.filter(log => log.round === round && log.turn === turn && log.context.success === true);
        }
        return targetList.filter(char => !logs.some(log => log.tUid === char.uid));
    }
    
    switch (act.target ?? 'prevSuccess') {
        case 'prev':
        case 'prevSuccess':
        case 'prevCritical':
        case 'prevFail':
            relevantLogs = combatHistory.filter(log => log.round === round && log.turn === turn && log.actIndex === (actIndex - 1)); //prev
            if (!act.target || act.target === 'prevSuccess') { relevantLogs = relevantLogs.filter(log => log.context.success === true); } //prevSuccess
            else if (act.target === 'prevFail') { relevantLogs = relevantLogs.filter(log => log.context.success === false); } //prevFail
            else if (act.target === 'prevCritical') { relevantLogs = relevantLogs.filter(log => log.context.critical === true); }
            prevUids = relevantLogs.map(log => log.tUid);
            if (!act.targetRepeat) { prevUids = [...new Set(prevUids)]; } //only targ each char once if !act.targetRepeat
            findCharacters(targetList, prevUids);
            targetList = filterDead(targetList); //removed dead chars unless act.targetDead or act.targetDeadOnly
            act.targetList = targetList;
            break;
        case 'enemyRandom':
        case 'allyRandom':
            if (act.target === 'enemyRandom') { team = targetTeam(c, 'enemy', true); }
            else if (act.target === 'allyRandom') {
                team = targetTeam(c, 'ally', true);
                if (act.targetOther) { team.filter(char => char.uid !== c.uid); } //remove self if act.targetOther
            }
            team = filterDead(team); //remove dead chars unless act.targetDead or act.targetDeadOnly
            team = filterPrev(team); //remove chars (act.targetNotPrev, act.targetNotPrevSuccess, act.targetNotPrec, act.targetNotPrecSuccess)
            console.log(`targetList after filterPrev is:`);
            console.log(deepClone(team));
            if (team.length === 0) {
                act.targetList = [];
                break;
            }
            if (!act.randomNumber && !act.randomMin) { //targ one random char
                targetIndex = Math.floor(Math.random() * team.length);
                targetList = [team[targetIndex]];
            } else if (act.randomNumber) { //if act.randomNumber targ specified n of chars
                for (let i = 1; (i <= act.randomNumber && team.length > 0); ++i) {
                    targetIndex = Math.floor(Math.random() * team.length);
                    targetList.push(team[targetIndex]);
                    if (!act.targetRepeat) { team.splice(targetIndex, 1); } //only targ each char once if !act.targetRepeat
                }
            } else if (act.randomMin && act.randomMax) { //if act.randomMin && act.randomMax targ varying number of chars
                const randomRange = (act.randomMax - act.randomMin);
                const randomAdd = Math.floor(Math.random () * (randomRange + 1));
                const targetCount = act.randomMin + randomAdd;
                for (let i = 1; (i <= targetCount && team.length > 0); ++i) {
                    targetIndex = Math.floor(Math.random() * team.length);
                    targetList.push(team[targetIndex]);
                    if (!act.targetRepeat) { team.splice(targetIndex, 1); } //only targ each char once if !act.targetRepeat
                }
            }
            act.targetList = targetList;
            break;
        case 'enemyTeam':
        case 'allyTeam':
            if (act.target === 'enemyTeam') { team = targetTeam(c, 'enemy', true); }
            else if (act.target === 'allyTeam') {
                team = targetTeam(c, 'ally', true);
                if (act.targetOther) { team.filter(char => char.uid !== c.uid); } //remove self if act.targetOther
            }
            team = filterDead(team); //remove dead chars unless act.targetDead or act.targetDeadOnly
            team = filterPrev(team); //remove chars (act.targetNotPrev, act.targetNotPrevSuccess, act.targetNotPrec, act.targetNotPrecSuccess)
            act.targetList = team; 
            break;
        case 'yourself':
            act.targetList = [c];
            break;
        case 'everyone':
            everyone = combat();
            if (act.targetOther) { everyone = everyone.filter(char => char.uid !== c.uid); } //remove self if act.targetOther
            everyone = filterDead(everyone); //remove dead chars unless act.targetDead or act.targetDeadOnly
            everyone = filterPrev(everyone); //remove chars (act.targetNotPrev, act.targetNotPrevSuccess, act.targetNotPrec, act.targetNotPrecSuccess)
            act.targetList = everyone;
            break;
    }
    console.groupEnd();
}

const baseCon = {
    fire: {
        id: 'fireCon',
        descriptor: 'Ablaze',
        textInflict: function (c) { return `${c.name} is on fire! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} is no longer ablaze.`; },
        tTurnStart: function (c) {
            const damage = Math.floor((c.maxHp / 20) + 0.5);
            c.adjustHp('damage', damage);
            createMessage('priority', `${c.name} is <b>ablaze</b>! (<u>${damage} damage</u>)`);
        }
    },
    water: {
        id: 'waterCon',
        descriptor: 'Soaked',
        textInflict: function (c) { return `${c.name} is wet! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} has dried.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is <b>soaked</b>. (<u>weak to ice and electric</u>)`);
        },
        eff: [
            { weak: ['ice', 'elec'] },
            { stat: 'dodgeM', multi: 0.95 }
        ],
        triggerEff: [
            { trigger: ['attackSuccessT'],
                category: ['ice'],
                triggerFn: function (c) {
                    createMessage('char', `${c.name} is drenched!, (<u>weak to ice</u>)`, c)
                }
            },
            { trigger: ['attackSuccessT'],
                category: ['elec'],
                triggerFn: function (c) {
                    createMessage('char', `${c.name} is drenched! (<u>weak to electric</u>)`, c)
                }
            }
        ]
    },
    air: {
        id: 'airCon',
        descriptor: 'Windblown',
        textInflict: function (c) { return `${c.name} is buffeted by wind! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} is no longer windblown.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is <b>windblown</b>.`);
        },
        eff: [
            { stat: 'accuracyM', multi: 0.925 },
            { stat: 'dodgeM', multi: 0.95 },
            { stat: 'damageM', multi: 0.90 }
        ]
    },
    earth: {
        id: 'earthCon',
            descriptor: 'Pebbled',
            textInflict: function (c) { return `${c.name} is battered by earth! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer pebbled.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} has been <b>pebbled</b>.`);
            },
            eff: [
                { stat: 'defenceM', multi: 0.85 },
                { stat: 'dodgeM', multi: 0.95 },
                { stat: 'damageM', multi: 0.90 }
            ]
    },
    ice: {
        id: 'iceCon',
        descriptor: 'Chill',
        textInflict: function (c) { return `${c.name} is freezing cold! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} warmed up a little.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is <b>freezing</b>.`);
        },
        eff: [
            { stat: 'damageM', multi: 0.85 },
            { stat: 'defenceM', multi: 0.90 },
            { stat: 'accuracyM', multi: 0.95 }
        ]
    },
    elec: {
        id: 'elecCon',
        descriptor: 'Shock',
        textInflict: function (c) { return `${c.name} is stunned! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} is no longer shocked.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is <b>shocked</b>.`);
        },
        eff: [
            { stat: 'dodgeM', multi: 0.925 },
            { stat: 'defenceM', multi: 0.90 },
            { stat: 'accuracyM', multi: 0.95 }
        ]
    },
    light: {
        id: 'lightCon',
        descriptor: 'Damned',
        textInflict: function (c) { return `${c.name} is scorned by angels! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} is no longer damned.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is <b>damned</b>. (<u>weak to light</u>)`);
        },
        eff: [ { weak: ['light'] } ],  
        triggerEff: [
            {trigger: ['attackT'],
                category: ['light'],
                triggerFn: function (c) {
                    createMessage('char', `${c.name} is <b>damned</b>. (<u>weak to light</u>)`, c)
                }
            }
        ]
    },
    dark: {
        id: 'darkCon',
        descriptor: 'Corrupt',
        textInflict: function (c) { return `${c.name}'s heart is corrupted! (<u>${this.descriptor}</u>)`; },
        textRemove: function (c) { return `${c.name} is no longer corrupted.`; },
        tTurnStart: function (c) {
            createMessage('priority', `${c.name} is </b>corrupted</b>. (<u>weak to dark</u>)`);
        },
        eff: [ { weak: ['dark'] } ],
        triggerEff: [
            {trigger: ['attackT'],
                category: ['dark'],
                triggerFn: function (c) {
                    createMessage('char', `${c.name}'s has been <b>corrupted</b>. (<u>weak to dark</u>).`, c);
                }
            }
        ]
    },
    phys: [
        {id: 'staggerCon',
            descriptor: 'Stagger',
            textInflict: function (c) { return `${c.name} is staggered! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer staggered.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} is <b>staggered</b>.`);
            },
            eff: [
                { stat: 'agi', multi: 0.90 },
                { stat: 'dodgeM', multi: 0.95 },
                { stat: 'accuracyM', multi: 0.975 }
            ]
        },
        {id: 'injuryCon',
            descriptor: 'Injury',
            textInflict: function (c) { return `${c.name} is injured! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} recovered from ${c.his} injury.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} is <b>injured</b>.`);
            },
            eff: [
                { stat: 'for', multi: 0.90 },
                { stat: 'defenceM', multi: 0.90 },
                { stat: 'dodgeM', multi: 0.975 }
            ]
        },
        {id: 'weakCon',
            descriptor: 'Weak',
            textInflict: function (c) { return `${c.name} is weakened! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer weakened.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} is <b>weakened</b>.`);
            },
            eff: [
                { stat: 'str', multi: 0.90 },
                { stat: 'damageM', multi: 0.90 },
                { stat: 'accuracyM', multi: 0.975 }
            ]
        },
        {id: 'woundCon',
            descriptor: 'Wound',
            tooltip: 'Deals 5% of max health as damage each turn.',
            textInflict: function (c) { return `${c.name} is wounded! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer wounded.`; },
            tTurnStart: function (c) {
                const damage = Math.floor((c.maxHp * 0.05) + 0.5);
                c.adjustHp('damage', damage);
                createMessage('priority', `${c.name} is badly <b>wounded</b>! (<u>${damage} damage</u>)`);
            }
        }
    ],
    mind: [
        {id: 'distractCon',
            descriptor: 'Distract',
            textInflict: function (c) { return `${c.name} is distracted! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer distracted.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} is <b>distracted</b>.`);
            },
            eff: [
                { stat: 'int', multi: 0.90 },
                { stat: 'accuracyM', multi: 0.95 },
                { stat: 'dodgeM', multi: 0.975 }
            ]
        },
        {id: 'doubtCon',
            descriptor: 'Doubt',
            textInflict: function (c) { return `${c.name} is doubting ${c.himself}! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name}'s confidence recovered.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} <b>doubts</b> ${c.himself}.`);
            },
            eff: [
                { stat: 'wil', multi: 0.90 },
                { stat: 'accuracyM', multi: 0.95 },
                { stat: 'damageM', multi: 0.95 }
            ]
        },
        {id: 'confusionCon',
            descriptor: 'Confusion',
            textInflict: function (c) { return `${c.name} is confused! (<u>${this.descriptor}</u>)`; },
            textRemove: function (c) { return `${c.name} is no longer confused.`; },
            tTurnStart: function (c) {
                createMessage('priority', `${c.name} is <b>confused</b>.`);
            },
            eff: [
                { stat: 'cha', multi: 0.90 },
                { stat: 'dodgeM', multi: 0.95 },
                { stat: 'defenceM', multi: 0.95 }
            ]
        }
    ]
};

//initialise playtesting characters
let glen = new Character('pc', 'char', 'ally');
ally.push(glen);
glen.knownName = glen.realName;
glen.protag = true;

const aLists = [
    {aList: ['blueShaman', 'merc']}
]
const randA = Math.floor(Math.random() * aLists.length);
const aList = aLists[randA];

aList.aList.forEach(charId => {
    const newChar = new Character(charId, 'char', 'ally');
    ally.push(newChar);
    newChar.knownName = newChar.realName;
});

const eLists = [
    {eList: ['merc', 'mercLeader', 'wolf']},
    {eList: ['malandro', 'malandro', 'capoierista']},
    {eList: ['rArchangel', 'rAngel', 'rAngel']},
    {eList: ['imp', 'littleDevil', 'littleDevil']},
]
const randE = Math.floor(Math.random() * eLists.length);
const eList = eLists[randE];

eList.eList.forEach(charId => {
    const newChar = new Character(charId, 'char', 'enemy');
    enemy.push(newChar);
});

initiateCombat();