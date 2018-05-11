function showElement(elementID,style) {
	document.getElementById(elementID).style.display=style
}
	
function hideElement(elementID) {
	document.getElementById(elementID).style.display='none'
}
	
function moveElement(elementID,moveTo) {
	document.getElementById(moveTo).appendChild(document.getElementById(elementID))
}
	
function updateClass(elementID,value) {
	document.getElementById(elementID).className=value
}
	
function updateStyle(elementID,styleID,value) {
	document.getElementById(elementID).style[styleID]=value
}

function updateElement(elementID,value) {
	document.getElementById(elementID).innerHTML=value
}

function switchTab(id) {
	currentTab=id
}

function format(value) {
	if (!(value instanceof Decimal)) value=new Decimal(value)
		
	if (value.exponent>=9000000000000000) {
		if (value.mantissa<0) return '-&#x221e;'
		return '&#x221e;'
	}
	if (Number.isNaN(value.mantissa)) return '?'
	var mantissa
	if (value.lt(1e3)) {
		mantissa=value.toFixed(0)
		if (parseFloat(mantissa)!=1e3) return mantissa
	}
	if (player.options.notation==0) {
		//Scientific
		var unencoded=format1OoMGroup(value)
		if (Decimal.gte(unencoded.exponent,1e5)) {
			var unencodedExp=format1OoMGroup(new Decimal(unencoded.exponent))
			return unencoded.mantissa.toFixed(2)+'e'+unencodedExp.mantissa.toFixed(2)+'e'+unencodedExp.exponent
		}
		return unencoded.mantissa.toFixed(2)+'e'+unencoded.exponent
	} else if (player.options.notation==1) {
		//Engineering
		var unencoded=format3OoMGroup(value)
		if (Decimal.gte(unencoded.group,3333.3)) {
			var unencodedExp=format3OoMGroup(Decimal.times(unencoded.group,3))
			return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencodedExp.mantissa.toFixed(2-unencodedExp.offset)+'e'+unencodedExp.group*3
		}
		return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencoded.group*3
	} else if (player.options.notation==2) {
		//Standard
		var unencoded=format3OoMGroup(value)
		return unencoded.mantissa.toFixed(2-unencoded.offset)+standard(unencoded.group-1)
	} else if (player.options.notation==3) {
		//Logarithm
		var log=value.log10()
		if (Decimal.gte(log,99999.995)) {
			return 'ee'+Decimal.log10(log).toFixed(2)
		}
		return 'e'+log.toFixed(2)
	}
	return '?'
}

function formatTime(s) {
	if (s < 1) {
		if (s < 0.002) return '1 millisecond'
		return Math.floor(s*1000)+' milliseconds'
	} else if (s < 59.5) {
		if (s < 1.005) return '1 second'
		return s.toPrecision(2)+' seconds'
	} else if (s < Number.POSITIVE_INFINITY) {
		var timeFormat=''
		var lastTimePart=''
		var needAnd=false
		var needComma=false
		for (id in timeframes) {
			if (id=='second') {
				s=Math.floor(s)
				if (s>0) {
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=s+(s==1?' second':' seconds')
				}
			} else if (id=='year') {
				var amount=Math.floor(s/31556952)
				if (amount>0) {
					s-=amount*31556952
					lastTimePart=format(amount,2,1)+(amount==1?' year':' years')
				}
			} else {
				var amount=Math.floor(s/timeframes[id])
				if (amount>0) {
					s-=amount*timeframes[id]
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=amount+' '+id+(amount==1?'':'s')
				}
			}
		}
		return timeFormat+(needComma?',':'')+(needAnd?' and ':'')+lastTimePart
	} else {
		return 'eternity'
	}
}

function format1OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=exponent+1
	}
	return {mantissa:mantissa,exponent:exponent}
}

function format3OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=exponent+1
	}
	var result={offset:exponent%3}
	result.mantissa=mantissa*Math.pow(10,result.offset)
	result.group=Math.floor(exponent/3)
	return result
}

function standard(label) {
	step=0
	abb=''
	abbFull=''
	
	if (label==0) {
		return 'k'
	}
	if (label==1) {
		return 'M'
	}
	do {
		var u=Math.floor(label)%10
		var t=Math.floor(label/10)%10
		var h=Math.floor(label/100)%10
		abb=''
		
		if (u>0&&!(u==1&&t==0&&h==0&&step>0)) {
			if (u==2&&t==0) {
				abb='B'
			} else {
				abb=haListU[u]
			}
		}
		if (t>0) {
			abb=abb+haListT[t]
			if (u==0&&t>1) {
				abb=abb+'g'
			}
		}
		if (h>0) {
			abb=abb+haListH[h]
		}
		highAbb=haListT2[step]
		if (u>0||t>0||h>0) {
			if (abbFull=='') {
				abbFull=abb+highAbb+abbFull
			} else {
				abbFull=abb+highAbb+'-'+abbFull
			}
		}
		label=label/1000
		step++
	} while (label>0)
	
	return abbFull
}

function loadGame() {
	var undecodedSave=localStorage.getItem("MTUyMzk5ODg3Njk1MA==")
	if (undecodedSave==null) gameLoopInterval=setInterval(gameLoop,50)
	else loadSave(undecodedSave)
	updateStyle('loading','top','-100%')
	showElement('mainGame','block')
	setTimeout(function(){hideElement('loading')},2000)
	gameLoop()
}

function saveGame() {
	try {
		localStorage.setItem("MTUyMzk5ODg3Njk1MA==",btoa(JSON.stringify(player)))
		lastSave=new Date().getTime()
	} catch (e) {
		console.log('A error has been occurred while saving:')
		console.error(e)
	}
}

function loadSave(savefile) {
	clearInterval(gameLoopInterval)
		
	try {
		savefile=JSON.parse(atob(savefile))
		
		if (savefile.version<=0.1) {
			if (savefile.beta<2) {
				savefile.totalDamage=0
				savefile.totalOres=0
				savefile.currentStone.ore='Stone'
				savefile.options.updateRate=20
			}
			if (savefile.beta<3) {
				savefile.depth=1
				savefile.maxDepth=1
			}
			if (savefile.beta<3.1) {
				savefile.workers={waitUntilDamage:0}
				
				var tempUpgrades=[]
				for (id in savefile.upgrades) {
					tempUpgrades.push(parseInt(id)+1)
				}
				savefile.upgrades=tempUpgrades
			}
		}
		
		savefile.totalDamage=new Decimal(savefile.totalDamage)
		savefile.currentStone.hp=new Decimal(savefile.currentStone.hp)
		savefile.currentStone.maxHp=new Decimal(savefile.currentStone.maxHp)
		savefile.stone=new Decimal(savefile.stone)
		savefile.totalStone=new Decimal(savefile.totalStone)
		for (var name in savefile.ores) savefile.ores[name]=new Decimal(savefile.ores[name])
		savefile.totalOres=new Decimal(savefile.totalOres)
		savefile.coins=new Decimal(savefile.coins)
		savefile.totalCoins=new Decimal(savefile.totalCoins)
		savefile.workers.waitUntilDamage=new Decimal(savefile.workers.waitUntilDamage)
	
		if (savefile.version>player.version) throw 'This savefile, which has version '+savefile.version+' saved, was incompatible to version '+player.version+'.'
		else if (savefile.version==player.version) {
			if (savefile.beta>player.beta) throw 'This savefile, which has beta '+savefile.beta+' saved, was incompatible to beta '+player.beta+'.'			
		}
		savefile.version=player.version
		savefile.beta=player.beta
		
		player=savefile
		
		hideElement('exportSave')
		updateNextRankText()
		updateCoinGain()
		updateHPS()
		updatePickaxePower()
		updateNextDepthRequirement()
		maxMillisPerTick=1000/player.options.updateRate
		
		simulatedTickLength=(new Date().getTime()-player.lastUpdate)/1e6
		if (simulatedTickLength>0.1) {
			simulatedTicksLeft=1000
			while (simulatedTicksLeft>0) {
				gameLoop(true)
				simulatedTicksLeft--
			}
		}
	} catch (e) {
		console.log('A error has been occurred while loading:')
		console.error(e)
	}
		
	gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
}

function exportSave() {
	var savefile=btoa(JSON.stringify(player))
	showElement('exportSave','block')
	document.getElementById("exportText").value=btoa(JSON.stringify(player))
}

function importSave() {
	var savefile=prompt('Copy and paste in your exported file and press enter.')
	if (savefile!='') loadSave(savefile)
}

function resetGame() {
	if (confirm("Are you sure to reset the game? Everything would be lost!")) {
		clearInterval(gameLoopInterval)
		
		player.playtime=0
		player.rank=1
		player.currentStone={hp:new Decimal(10),maxHp:new Decimal(10),ore:'Stone'}
		player.totalDamage=new Decimal(0)
		player.stone=new Decimal(0)
		player.totalStone=new Decimal(0)
		player.ores={}
		player.totalOres=new Decimal(0)
		player.coins=new Decimal(0)
		player.totalCoins=new Decimal(0)
		player.upgrades=[]
		player.workers={waitUntilDamage:new Decimal(0)}
		player.depth=1
		player.maxDepth=1
		player.options={notation:0,
			updateRate:20}
		
		localStorage.clear("MTUyMzk5ODg3Njk1MA==")
		hideElement('exportSave')
		nextRankText='(Next rank requires 10 stone)'
		coinGain=new Decimal(0)
		totalHPS=new Decimal(0)
		pickaxePower=new Decimal(1)
		nextDepthRequirement=new Decimal(100)
		maxMillisPerTick=50
		
		gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
	}
}

function changeUpdateRate() {
	clearInterval(gameLoopInterval)
	
	player.options.updateRate+=5
	if (player.options.updateRate==Number.MAX_VALUE) player.options.updateRate=5
	if (player.options.updateRate==65) player.options.updateRate=Number.MAX_VALUE
	
	maxMillisPerTick=1000/player.options.updateRate
	gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
}

function gameLoop() {
	if (tickDone) {
		tickDone=false
		setTimeout(function(){
			var startTime=new Date().getTime()
			try {
				gameTick()
			} catch (e) {
				console.log('A game error has occured:')
				console.error(e)
			}
			tickSpeed=Math.max((new Date().getTime()-startTime)*0.2+tickSpeed*0.8,maxMillisPerTick)
			startTime=new Date().getTime()
			tickDone=true
		},tickSpeed-maxMillisPerTick)
	}
}